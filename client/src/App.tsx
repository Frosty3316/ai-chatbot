import { useEffect, useRef, useState } from "react";
import { ChatList } from "./components/ChatList";
import { Composer } from "./components/Composer";
import { EmptyState } from "./components/EmptyState";
import { DownIcon, Mark } from "./components/Icons";
import { MessageBubble } from "./components/MessageBubble";
import { Sidebar } from "./components/Sidebar";
import { useChat } from "./hooks/useChat";
import type { ChatAttachment } from "./types";
import "./App.css";

export default function App() {
  const {
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
  } = useChat();
  const [showJump, setShowJump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const last = messages[messages.length - 1];
  const pending = status === "streaming" && last?.role === "assistant" && !last.content;

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || !stickRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function onScroll() {
    const node = scrollerRef.current;
    if (!node) return;
    const gap = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickRef.current = gap < 80;
    setShowJump(gap > 96);
  }

  function ask(prompt: string, attachments?: ChatAttachment[]) {
    stickRef.current = true;
    setMenuOpen(false);
    send(prompt, attachments);
  }

  function jumpToLatest() {
    stickRef.current = true;
    const node = scrollerRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    setShowJump(false);
  }

  return (
    <div className="shell">
      <Sidebar
        connection={connection}
        conversations={conversations}
        activeId={activeId}
        onAsk={ask}
        onNew={createChat}
        onSelect={selectChat}
        onDelete={deleteChats}
        onRename={renameChat}
        onPin={pinChats}
        remainingGeneral={quota.remaining}
        generalLimit={quota.limit}
      />

      <main className="stage">
        <header className="topbar">
          <div className="topbar-brand">
            <Mark size={20} />
            <div>
              <strong>Dossier</strong>
              <span>Ask anything</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button type="button" className="ghost menu-toggle" onClick={() => setMenuOpen((open) => !open)}>
              Chats
            </button>
            <button type="button" className="ghost" onClick={createChat}>
              New chat
            </button>
            <a className="ghost" href="https://github.com/Frosty3316" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </header>

        <div
          ref={scrollerRef}
          className={`transcript ${messages.length === 0 ? "is-empty" : ""}`}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <EmptyState onAsk={ask} />
          ) : (
            <div className="thread">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  pending={pending && message.id === last.id}
                />
              ))}
            </div>
          )}
        </div>

        {showJump && (
          <button type="button" className="jump" onClick={jumpToLatest} aria-label="Jump to latest">
            <DownIcon />
          </button>
        )}

        {error && status === "error" && (
          <p className="banner" role="status">
            {error}
          </p>
        )}

        <Composer
          status={status}
          remainingGeneral={quota.remaining}
          generalLimit={quota.limit}
          onSend={ask}
          onStop={stop}
        />
      </main>

      {menuOpen && (
        <>
          <button
            type="button"
            className="mobile-chats-backdrop"
            aria-label="Close chats"
            onClick={() => setMenuOpen(false)}
          />
          <div className="mobile-chats" role="dialog" aria-label="Chats">
            <div className="mobile-chats-head">
              <strong>Chats</strong>
              <button type="button" className="ghost" onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </div>
            <button type="button" className="icon-btn send new-chat" onClick={() => { createChat(); setMenuOpen(false); }}>
              New chat
            </button>
            <ChatList
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                selectChat(id);
                setMenuOpen(false);
              }}
              onDelete={deleteChats}
              onRename={renameChat}
              onPin={pinChats}
            />
          </div>
        </>
      )}
    </div>
  );
}
