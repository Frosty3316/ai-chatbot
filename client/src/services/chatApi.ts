const API_URL = "https://ai-chatbot-opez.onrender.com/chat";

export async function chatWithBackend(message: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Backend error");
  }

  const data = await res.json();
  return data.reply;
}