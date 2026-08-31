import type { Request, Response, NextFunction } from "express";
import type { ChatTurn } from "../types.js";

const MAX_MESSAGE = 2_000;
const MAX_HISTORY = 12;
const MAX_TURN = 4_000;

function isTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as ChatTurn;
  return (
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.content === "string" &&
    turn.content.length <= MAX_TURN
  );
}

export function validateChat(req: Request, res: Response, next: NextFunction) {
  const message = req.body?.message;
  const history = req.body?.history;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: "Message is too long." });
  }

  if (history !== undefined) {
    if (!Array.isArray(history) || history.length > MAX_HISTORY || !history.every(isTurn)) {
      return res.status(400).json({ error: "Conversation history is invalid." });
    }
  }

  req.body.message = message.trim();
  req.body.history = Array.isArray(history) ? history : [];
  next();
}
