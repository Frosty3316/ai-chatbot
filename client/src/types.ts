export type Role = "user" | "assistant";

export type ChatAttachment = {
  id: string;
  name: string;
  mime: string;
  kind: "image" | "file";
  dataUrl?: string;
  text?: string;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  time: string;
  attachments?: ChatAttachment[];
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  pinned?: boolean;
  messages: ChatMessage[];
};

export type ChatStatus = "idle" | "streaming" | "error";

export type ConnectionState = "checking" | "ready" | "waking" | "offline";
