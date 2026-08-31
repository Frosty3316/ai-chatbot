import type { ChatTurn } from "../types.js";

export function llmEnabled(): boolean {
  return false;
}

export async function streamGroundedReply(
  _message: string,
  _history: ChatTurn[],
  _onDelta: (text: string) => void,
  _signal?: AbortSignal
): Promise<void> {
  throw new Error("Express is a local fallback. Production general chat runs on Vercel via Groq.");
}
