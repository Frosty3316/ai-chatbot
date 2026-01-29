import { useEffect, useRef, useState } from "react";
import "./App.css";
import { chatWithBackend } from "./services/chatApi";

type Message = {
  role: "user" | "bot";
  content: string;
  time: string;
  files?: { url: string; name: string; type: string }[];
  reactions?: string[];
};

const SUGGESTIONS = [
  "Who is Faustina?",
  "What are her skills?",
  "Show me her projects",
  "What tech stack does she use?",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef("");

  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://js.puter.com/v2/";
  script.defer = true;
  document.body.appendChild(script);
}, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(
      el.scrollHeight - el.scrollTop - el.clientHeight > 80
    );
  }

  async function fakeStream(text: string, time: string) {
  setIsTyping(true);
  streamRef.current = "";

  let botIndex = -1;

  // Safely append bot message and capture index
  setMessages((prev) => {
    botIndex = prev.length;
    return [...prev, { role: "bot", content: "", time }];
  });

  const interval = setInterval(() => {
    streamRef.current += text[streamRef.current.length];

    setMessages((prev) =>
      prev.map((m, i) =>
        i === botIndex ? { ...m, content: streamRef.current } : m
      )
    );

    if (streamRef.current.length >= text.length) {
      clearInterval(interval);
      setIsTyping(false);
    }
  }, 40);
}

  async function sendMessage(text?: string) {
    const userText = text ?? input;
    if (!userText.trim() && files.length === 0) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const uploadedFiles = files.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
    }));

    setMessages((p) => [
      ...p,
      {
        role: "user",
        content: userText,
        time,
        files: uploadedFiles.length ? uploadedFiles : undefined,
      },
    ]);

    setInput("");
    setFiles([]);

    try {
      const reply = await chatWithBackend(userText);
      await fakeStream(reply, time);
    } catch {
      setMessages((p) => [
        ...p,
        {
          role: "bot",
          content: "⚠️ Server error. Is backend running?",
          time,
        },
      ]);
      setIsTyping(false);
    }
  }

  return (
    <div className="app dark">
      <div className="chat-container">
        <header className="chat-header">
          <h2>🤖 AI Portfolio Chatbot</h2>
        </header>

        <div
          className="chat-messages"
          ref={containerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <div>{m.content}</div>

              {m.files?.map((f, idx) =>
                f.type.startsWith("image") ? (
                  <img
                    key={idx}
                    src={f.url}
                    className="chat-image"
                    width={240}
                    loading="lazy"
                    decoding="async"
                    alt={f.name}
                    onClick={() => setLightbox(f.url)}
                  />
                ) : (
                  <div key={idx} className="chat-file">
                    📄 {f.name}
                  </div>
                )
              )}

              <span className="timestamp">{m.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="bubble bot typing">
              <span className="dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {showScrollBtn && (
          <button
            className="scroll-down"
            aria-label="Scroll to latest message"
            onClick={() =>
              endRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            ⬇
          </button>
        )}

        {messages.length === 0 && window.innerWidth > 768 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="file-preview">
          {files.map((f, i) => (
            <div key={i}>
              {f.type.startsWith("image") ? "🖼️" : "📄"} {f.name}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <label className="attach" aria-label="Attach file">
            📎
            <input
              type="file"
              hidden
              multiple
              onChange={(e) =>
                setFiles([...files, ...(e.target.files ?? [])])
              }
            />
          </label>

          <input
            value={input}
            aria-label="Chat message input"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Faustina…"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button aria-label="Send message" onClick={() => sendMessage()}>
            Send
          </button>
        </div>

        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="Preview" />
          </div>
        )}
      </div>
    </div>
  );
}