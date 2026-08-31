import type { Response } from "express";

export function openSse(res: Response) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

export function writeSse(res: Response, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function streamWords(
  res: Response,
  text: string,
  shouldStop: () => boolean
) {
  const chunks = text.split(/(\s+)/);
  for (const chunk of chunks) {
    if (shouldStop()) return;
    writeSse(res, { delta: chunk });
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
}
