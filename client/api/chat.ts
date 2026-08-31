import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { SYSTEM_PROMPT } from "./_lib/prompt.js";

export const runtime = "nodejs";
export const maxDuration = 30;

const GENERAL_LIMIT = 8;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 15_000;
const MAX_MESSAGE = 8_000;
const MAX_HISTORY = 16;
const MAX_TURN = 4_000;
const MAX_ATTACH = 4;
const MAX_ATTACH_TEXT = 16_000;
const MAX_DATA_URL = 5_000_000;
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "qwen/qwen3.6-27b";
const ALLOWED_FILE_MIME = /^(image\/|text\/|application\/(json|javascript|pdf)|application\/octet-stream)/i;

type Bucket = { used: number; resetAt: number; lastAt: number };
const buckets = new Map<string, Bucket>();

type IncomingAttachment = {
  name?: string;
  mime?: string;
  kind?: "image" | "file";
  dataUrl?: string;
  text?: string;
};

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }
  | { type: "file"; data: string; mediaType: string };

function clientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

function bucketFor(id: string, now: number): Bucket {
  const current = buckets.get(id);
  if (!current || current.resetAt <= now) {
    return { used: 0, resetAt: now + WINDOW_MS, lastAt: 0 };
  }
  return current;
}

function checkSlot(id: string): { ok: true } | { ok: false; status: number; error: string } {
  const now = Date.now();
  const bucket = bucketFor(id, now);

  if (bucket.used >= GENERAL_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: `Daily general-question limit reached (${GENERAL_LIMIT}). Portfolio questions stay unlimited.`,
    };
  }
  const wait = COOLDOWN_MS - (now - bucket.lastAt);
  if (wait > 0) {
    return {
      ok: false,
      status: 429,
      error: `Wait ${Math.ceil(wait / 1000)}s before another general question.`,
    };
  }

  return { ok: true };
}

function consumeSlot(id: string) {
  const now = Date.now();
  const bucket = bucketFor(id, now);
  buckets.set(id, { ...bucket, used: bucket.used + 1, lastAt: now });
}

function refundSlot(id: string) {
  const now = Date.now();
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt <= now) return;
  buckets.set(id, { ...bucket, used: Math.max(0, bucket.used - 1) });
}

function sanitizeHistory(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((turn): turn is { role: string; content: unknown } => Boolean(turn) && typeof turn === "object")
    .filter((turn) => turn.role === "user" || turn.role === "assistant")
    .slice(-MAX_HISTORY)
    .map((turn) => ({
      role: turn.role as "user" | "assistant",
      content: String(turn.content ?? "").slice(0, MAX_TURN),
    }))
    .filter((turn) => turn.content.trim().length > 0);
}

function partsFromAttachments(attachments: IncomingAttachment[]): ContentPart[] {
  const parts: ContentPart[] = [];
  for (const item of attachments.slice(0, MAX_ATTACH)) {
    const name = String(item.name ?? "file").slice(0, 180);
    if (item.kind === "image" && typeof item.dataUrl === "string" && item.dataUrl.startsWith("data:image/")) {
      if (item.dataUrl.length > MAX_DATA_URL) continue;
      parts.push({ type: "image", image: item.dataUrl });
      continue;
    }
    if (typeof item.text === "string" && item.text.trim()) {
      parts.push({
        type: "text",
        text: `\n\nAttached file: ${name}\n${item.text.slice(0, MAX_ATTACH_TEXT)}`,
      });
      continue;
    }
    if (typeof item.dataUrl === "string" && item.dataUrl.startsWith("data:") && item.dataUrl.length <= MAX_DATA_URL) {
      const mime = String(item.mime ?? "").slice(0, 80);
      if (!ALLOWED_FILE_MIME.test(mime)) continue;
      const raw = item.dataUrl.includes(",") ? item.dataUrl.split(",")[1] : item.dataUrl;
      if (!raw) continue;
      parts.push({ type: "file", data: raw, mediaType: mime || "application/octet-stream" });
    }
  }
  return parts;
}

function errorText(error: unknown, depth = 0): string {
  if (depth > 5 || error == null) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const cause = "cause" in error ? errorText(error.cause, depth + 1) : "";
    return `${error.message} ${cause}`.trim();
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function userFriendly(error: unknown): string {
  const text = errorText(error);
  if (/api key|unauthorized|401|invalid.*key/i.test(text)) {
    return "Ask-anything is unavailable right now. Portfolio questions still work with no limit.";
  }
  if (/429|rate limit|capacity/i.test(text)) {
    return "The hosted model is busy right now. Wait a moment, or ask about Faustina — that path is unlimited.";
  }
  if (/abort|timeout|timed out|empty/i.test(text)) {
    return "The hosted model took too long. Try again, or ask about Faustina — that path is unlimited.";
  }
  return "The hosted model is unavailable right now. Portfolio questions still work with no limit.";
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      {
        error: "Ask-anything is not configured. Portfolio questions stay unlimited.",
      },
      { status: 503 }
    );
  }

  let body: {
    message?: string;
    history?: { role: string; content: string }[];
    attachments?: IncomingAttachment[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACH) : [];
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message && attachments.length === 0) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return Response.json({ error: "Message is too long." }, { status: 400 });
  }

  const id = clientId(req);
  const slot = checkSlot(id);
  if (slot.ok === false) {
    return Response.json({ error: slot.error }, { status: slot.status });
  }
  consumeSlot(id);

  const history = sanitizeHistory(body.history);
  const prompt =
    message || "Review the attached files and answer clearly. If they are images, describe what you see.";
  const extra = partsFromAttachments(attachments);
  const needsVision = extra.some((part) => part.type === "image" || part.type === "file");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ mode: "llm" });

      let billed = true;

      try {
        const result = await generateText({
          model: groq(needsVision ? VISION_MODEL : TEXT_MODEL),
          system: SYSTEM_PROMPT,
          maxRetries: 0,
          providerOptions: {
            groq: {
              reasoningEffort: "low",
              reasoningFormat: "hidden",
            },
          },
          messages: [
            ...history,
            extra.length > 0
              ? {
                  role: "user" as const,
                  content: [{ type: "text" as const, text: prompt }, ...extra],
                }
              : { role: "user" as const, content: prompt },
          ],
        });

        const text = result.text.trim();
        if (!text) throw new Error("empty");

        const pieces = text.match(/(\s+|\S+)/g) ?? [text];
        for (const piece of pieces) send({ delta: piece });
        send({ done: true });
      } catch (error) {
        console.error("[dossier/chat]", error instanceof Error ? error.message : "error");
        if (billed) {
          refundSlot(id);
          billed = false;
        }
        send({ error: userFriendly(error) });
        send({ done: true });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
