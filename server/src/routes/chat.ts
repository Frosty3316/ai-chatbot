import { Router } from "express";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateChat } from "../middleware/validate.js";
import { answerFromPortfolio } from "../services/knowledge.js";
import { llmEnabled, streamGroundedReply } from "../services/llm.js";
import { openSse, streamWords, writeSse } from "../utils/sse.js";

const router = Router();

router.post("/", rateLimit, validateChat, async (req, res) => {
  const { message, history } = req.body as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  const grounded = answerFromPortfolio(message, history);
  const abort = new AbortController();
  let stopped = false;
  let streamed = false;

  req.on("aborted", () => {
    stopped = true;
    abort.abort();
  });

  openSse(res);
  writeSse(res, { mode: llmEnabled() ? "llm" : "retrieval", topic: grounded.topic });

  try {
    if (llmEnabled()) {
      await Promise.race([
        streamGroundedReply(
          message,
          history,
          (delta) => {
            streamed = true;
            if (!stopped && !res.writableEnded) writeSse(res, { delta });
          },
          abort.signal
        ),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(() => reject(new Error("llm-timeout")), 8_000);
          abort.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new Error("aborted"));
            },
            { once: true }
          );
        }),
      ]);
    } else {
      streamed = true;
      await streamWords(res, grounded.reply, () => stopped || res.writableEnded);
    }
  } catch {
    // fall through to retrieval if the model is unavailable
  }

  if (!stopped && !streamed && !res.writableEnded) {
    await streamWords(res, grounded.reply, () => stopped || res.writableEnded);
  }

  if (!res.writableEnded) {
    writeSse(res, { done: true });
    res.end();
  }
});

export default router;
