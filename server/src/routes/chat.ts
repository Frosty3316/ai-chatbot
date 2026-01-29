import { Router } from "express";
import { answerFromPortfolio } from "../services/portfolio";

const router = Router();

router.post("/", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No message received." });
  }

  const reply = answerFromPortfolio(message);
  res.json({ reply });
});

export default router;