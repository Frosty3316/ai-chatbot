import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";
import { llmEnabled } from "./services/llm.js";
import { portfolio } from "./services/knowledge.js";

const app = express();

const allowedOrigins = new Set(["https://frosty3316.github.io"]);
const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || localOrigin.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"));
    },
  })
);
app.use(express.json({ limit: "8kb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "dossier",
    mode: llmEnabled() ? "llm" : "retrieval",
  });
});

app.get("/portfolio", (_req, res) => {
  res.json({
    name: portfolio.name,
    role: portfolio.role,
    location: portfolio.location,
    github: portfolio.github,
  });
});

app.use("/chat", chatRoute);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error.message === "Origin not allowed") {
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }
  res.status(500).json({ error: "Unexpected server error." });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Dossier API on http://localhost:${PORT} (${llmEnabled() ? "llm" : "retrieval"} mode)`);
});
