import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { slimForStorage } from "../services/attachments";
import { loadConversations, saveConversations, titleFromPrompt } from "../services/conversations";
import { streamGeneral } from "../services/generalAi";
import { answerFromPortfolio, isPortfolioQuestion, streamText, type RouteKind } from "../services/knowledge";
import { canConsumeGeneral, consumeGeneral, generalQuota } from "../services/quota";
import type { ChatAttachment, ChatMessage, ChatStatus, ConnectionState, Conversation } from "../types";

function stamp(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createId(): string {
  return crypto.randomUUID();
}

function blankChat(): Conversation {
  return {
    id: createId(),
    title: "New chat",
    updatedAt: Date.now(),
    pinned: false,
    messages: [],
  };
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [connection] = useState<ConnectionState>("ready");
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState(() => generalQuota());
  const abortRef = useRef<AbortController | null>(null);
  const lastSourceRef = useRef<RouteKind | undefined>(undefined);

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const createChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    lastSourceRef.current = undefined;
    const next = blankChat();
    setConversations((current) => [next, ...current.filter((item) => item.pinned || item.messages.length > 0)]);
    setActiveId(next.id);
    setStatus("idle");
    setError(null);
    return next.id;
  }, []);

  const selectChat = useCallback((id: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setActiveId(id);
    setStatus("idle");
    setError(null);
  }, []);

  const deleteChats = useCallback((ids: string[]) => {
    const remove = new Set(ids);
    setConversations((current) => current.filter((item) => !remove.has(item.id)));
    setActiveId((current) => (current && remove.has(current) ? null : current));
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    const next = title.replace(/\s+/g, " ").trim();
    if (!next) return;
    setConversations((current) =>
      current.map((item) => (item.id === id ? { ...item, title: next.slice(0, 80), updatedAt: Date.now() } : item))
    );
  }, []);

  const pinChats = useCallback((ids: string[], pinned: boolean) => {
    const target = new Set(ids);
    setConversations((current) =>
      current.map((item) => (target.has(item.id) ? { ...item, pinned, updatedAt: Date.now() } : item))
    );
  }, []);

  const send = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      const content = text.trim();
      if (!content && attachments.length === 0) return;

      const portfolioTurn = attachments.length === 0 && isPortfolioQuestion(content, lastSourceRef.current);
      if (!portfolioTurn) {
        const gate = canConsumeGeneral();
        setQuota(generalQuota());
        if (!gate.ok) {
          setError(
            gate.reason === "cooldown"
              ? `Wait ${Math.ceil((gate.waitMs ?? 1000) / 1000)}s before another general question. Portfolio questions are still unlimited.`
              : `Daily general-question limit reached (${generalQuota().limit}). Ask about Faustina as much as you like — that path is unlimited.`
          );
          setStatus("error");
          return;
        }
      }

      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const conversationId = activeId ?? createId();
      if (!activeId) setActiveId(conversationId);
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: content || (attachments.length ? "Review the attached files." : ""),
        time: stamp(),
        attachments: slimForStorage(attachments),
      };
      const assistantId = createId();

      setError(null);
      setStatus("streaming");
      setConversations((current) => {
        const exists = current.some((item) => item.id === conversationId);
        const base = exists ? current : [{ ...blankChat(), id: conversationId }, ...current];
        return base.map((item) => {
          if (item.id !== conversationId) return item;
          const untitled = item.messages.length === 0 && (item.title === "New chat" || !item.title);
          return {
            ...item,
            title: untitled ? titleFromPrompt(content || attachments[0]?.name || "New chat") : item.title,
            updatedAt: Date.now(),
            messages: [
              ...item.messages,
              userMessage,
              { id: assistantId, role: "assistant", content: "", time: stamp() },
            ],
          };
        });
      });

      const history = [...messages, userMessage].filter((message) => message.content);
      let received = false;
      let billed = false;

      const append = (delta: string) => {
        received = true;
        if (!portfolioTurn && !billed) {
          billed = true;
          consumeGeneral();
          setQuota(generalQuota());
        }
        setConversations((current) =>
          current.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  messages: item.messages.map((message) =>
                    message.id === assistantId ? { ...message, content: message.content + delta } : message
                  ),
                }
              : item
          )
        );
      };

      try {
        if (portfolioTurn) {
          lastSourceRef.current = "portfolio";
          await streamText(answerFromPortfolio(content), append, () => abort.signal.aborted);
        } else {
          lastSourceRef.current = "general";
          await streamGeneral({
            history,
            attachments,
            onDelta: append,
            signal: abort.signal,
          });
        }
        setStatus("idle");
      } catch (caught) {
        if (abort.signal.aborted && received) {
          setStatus("idle");
          return;
        }
        const copy =
          caught instanceof Error && caught.message === "timeout"
            ? "The hosted model took too long. Try again, or ask about Faustina — that path is unlimited."
            : caught instanceof Error && caught.message === "limited"
              ? "The free general model is busy. Portfolio questions still work with no limit."
              : caught instanceof Error && caught.message.length > 8 && caught.message !== "model"
                ? caught.message
                : "The general model could not reply. Portfolio questions still work with no sign-in.";
        setStatus("error");
        setError(copy);
        setConversations((current) =>
          current.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  messages: item.messages.map((message) =>
                    message.id === assistantId && !message.content ? { ...message, content: copy } : message
                  ),
                }
              : item
          )
        );
      } finally {
        if (abortRef.current === abort) abortRef.current = null;
      }
    },
    [activeId, messages]
  );

  return {
    conversations,
    activeId,
    messages,
    status,
    connection,
    error,
    quota,
    send,
    stop,
    createChat,
    selectChat,
    deleteChats,
    renameChat,
    pinChats,
  };
}
