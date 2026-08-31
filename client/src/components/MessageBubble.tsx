import { useState } from "react";
import { CopyIcon } from "./Icons";
import { RichText } from "../lib/format";
import type { ChatMessage } from "../types";

type MessageBubbleProps = {
  message: ChatMessage;
  pending?: boolean;
};

export function MessageBubble({ message, pending }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const attachments = message.attachments ?? [];

  async function copy() {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={`message ${isUser ? "message-user" : "message-bot"}`}>
      <div className="message-meta">
        <span>{isUser ? "You" : "Dossier"}</span>
        <time>{message.time}</time>
      </div>

      {attachments.length > 0 && (
        <div className="message-attach">
          {attachments.map((file) =>
            file.kind === "image" && file.dataUrl ? (
              <img key={file.id} src={file.dataUrl} alt={file.name} />
            ) : (
              <span key={file.id} className="attach-file">
                {file.name}
              </span>
            )
          )}
        </div>
      )}

      <div className="message-body">
        {message.content ? (
          isUser ? (
            <p>{message.content}</p>
          ) : (
            <RichText text={message.content} />
          )
        ) : (
          <span className="pending" aria-label="Assistant is writing">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>

      {!isUser && message.content && !pending && (
        <button type="button" className="copy" onClick={copy}>
          <CopyIcon />
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </article>
  );
}
