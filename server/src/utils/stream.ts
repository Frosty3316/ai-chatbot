import { Response } from "express";

export async function streamText(
  res: Response,
  text: string,
  delay = 30
) {
  const words = text.split(" ");

  for (const word of words) {
    res.write(word + " ");
    await new Promise((r) => setTimeout(r, delay));
  }

  res.end();
}