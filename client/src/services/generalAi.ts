import type { ChatAttachment, ChatMessage } from "../types";

const FIRST_TOKEN_MS = 22_000;
const TOTAL_MS = 45_000;

function parseSse(
  buffer: string,
  onDelta: (text: string) => void,
  onError: (text: string) => void
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload) as { delta?: string; error?: string };
        if (json.delta) onDelta(json.delta);
        if (json.error) onError(json.error);
      } catch {
        // ignore malformed frames
      }
    }
  }

  return rest;
}

export async function streamGeneral(options: {
  history: ChatMessage[];
  attachments?: ChatAttachment[];
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const last = options.history[options.history.length - 1];
  const message = last?.role === "user" ? last.content : "";
  const prior = options.history.slice(0, -1);

  const local = new AbortController();
  const abortParent = () => local.abort();
  options.signal?.addEventListener("abort", abortParent);

  const totalTimer = window.setTimeout(() => local.abort(), TOTAL_MS);
  let firstTimer: number | undefined = window.setTimeout(() => local.abort(), FIRST_TOKEN_MS);
  let received = false;
  let remoteError = "";

  const onDelta = (text: string) => {
    if (!received) {
      received = true;
      if (firstTimer !== undefined) window.clearTimeout(firstTimer);
      firstTimer = undefined;
    }
    options.onDelta(text);
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: local.signal,
      body: JSON.stringify({
        message,
        history: prior.map(({ role, content }) => ({ role, content })),
        attachments: options.attachments?.map(({ name, mime, kind, dataUrl, text }) => ({
          name,
          mime,
          kind,
          dataUrl,
          text,
        })),
      }),
    });

    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 429) throw new Error(data.error || "limited");
      throw new Error(data.error || "model");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer = parseSse(
        buffer + decoder.decode(value, { stream: true }),
        onDelta,
        (text) => {
          remoteError = text;
        }
      );
    }
    if (buffer.trim()) {
      parseSse(`${buffer}\n\n`, onDelta, (text) => {
        remoteError = text;
      });
    }

    if (!received) throw new Error(remoteError || "timeout");
  } catch (caught) {
    if (options.signal?.aborted) throw caught;
    if (local.signal.aborted && !received) throw new Error(remoteError || "timeout");
    throw caught;
  } finally {
    window.clearTimeout(totalTimer);
    if (firstTimer !== undefined) window.clearTimeout(firstTimer);
    options.signal?.removeEventListener("abort", abortParent);
  }
}
