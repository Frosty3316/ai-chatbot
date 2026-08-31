import type { Conversation } from "../types";

const KEY = "dossier.conversations.v1";
const MAX_CHATS = 40;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const item = value as Conversation;
  return typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.messages);
}

function forStorage(conversations: Conversation[]): Conversation[] {
  const ordered = [...conversations].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
  return ordered.slice(0, MAX_CHATS).map((chat) => ({
    ...chat,
    messages: chat.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map(({ id, name, mime, kind, text }) => ({
        id,
        name,
        mime,
        kind,
        text,
      })),
    })),
  }));
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isConversation).map((item) => ({
      ...item,
      pinned: Boolean(item.pinned),
    }));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  const payload = forStorage(conversations);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    try {
      const lighter = payload.filter((chat) => chat.pinned || chat.messages.length > 0).slice(0, 12);
      window.localStorage.setItem(KEY, JSON.stringify(lighter));
    } catch {
      // Storage full — keep the in-memory session only.
    }
  }
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function titleFromPrompt(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 42) return compact;
  return `${compact.slice(0, 41).trim()}…`;
}
