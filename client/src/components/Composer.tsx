import { useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { ACCEPT, canAddMore, fromFiles } from "../services/attachments";
import { AttachIcon, SendIcon, StopIcon } from "./Icons";
import type { ChatAttachment, ChatStatus } from "../types";

const MAX = 8000;

type ComposerProps = {
  status: ChatStatus;
  remainingGeneral: number;
  generalLimit: number;
  onSend: (value: string, attachments?: ChatAttachment[]) => void;
  onStop: () => void;
};

export function Composer({ status, remainingGeneral, generalLimit, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streaming = status === "streaming";
  const disabled = (!value.trim() && files.length === 0) && !streaming;

  async function addFiles(list: FileList | File[]) {
    setAttachError(null);
    try {
      const room = 4 - files.length;
      if (room <= 0 || !canAddMore(files)) {
        setAttachError("You can attach up to 4 files.");
        return;
      }
      const incoming = await fromFiles(Array.from(list).slice(0, room));
      setFiles((current) => [...current, ...incoming]);
    } catch (caught) {
      setAttachError(caught instanceof Error ? caught.message : "Could not attach that file.");
    }
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (streaming || (!value.trim() && files.length === 0)) return;
    onSend(value, files);
    setValue("");
    setFiles([]);
    setAttachError(null);
    if (inputRef.current) inputRef.current.style.height = "";
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function onDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    if (streaming || !event.dataTransfer.files.length) return;
    void addFiles(event.dataTransfer.files);
  }

  return (
    <form className="composer" onSubmit={submit} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
      <label className="sr-only" htmlFor="composer-input">
        Message
      </label>
      {files.length > 0 && (
        <ul className="attach-list">
          {files.map((file) => (
            <li key={file.id} className="attach-chip">
              {file.kind === "image" && file.dataUrl ? (
                <img src={file.dataUrl} alt="" />
              ) : (
                <span className="attach-file">{file.name}</span>
              )}
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        id="composer-input"
        ref={inputRef}
        rows={1}
        maxLength={MAX}
        value={value}
        disabled={streaming}
        placeholder="Ask anything — or ask about Faustina’s work…"
        onChange={(event) => {
          setValue(event.target.value);
          event.target.style.height = "auto";
          event.target.style.height = `${Math.min(event.target.scrollHeight, 144)}px`;
        }}
        onKeyDown={onKeyDown}
      />
      {attachError && <p className="attach-error">{attachError}</p>}
      <div className="composer-bar">
        <div className="composer-tools">
          <input
            ref={pickerRef}
            className="sr-only"
            type="file"
            accept={ACCEPT}
            multiple
            disabled={streaming}
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            className="icon-btn attach"
            disabled={streaming || files.length >= 4}
            aria-label="Upload files or photos"
            onClick={() => pickerRef.current?.click()}
          >
            <AttachIcon />
          </button>
          <span className="hint">
            {streaming
              ? "Streaming"
              : `${remainingGeneral}/${generalLimit} general left · portfolio unlimited`}
          </span>
        </div>
        {streaming ? (
          <button type="button" className="icon-btn stop" onClick={onStop} aria-label="Stop response">
            <StopIcon />
            Stop
          </button>
        ) : (
          <button type="submit" className="icon-btn send" disabled={disabled} aria-label="Send message">
            <SendIcon />
            Send
          </button>
        )}
      </div>
    </form>
  );
}
