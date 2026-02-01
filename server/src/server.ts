import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("🤖 Portfolio chatbot backend running");
});

app.use("/chat", chatRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);