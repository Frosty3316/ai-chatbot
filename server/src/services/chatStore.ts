type ChatMessage = {
  role: "user" | "bot";
  content: string;
  time: string;
};

const chatHistory: ChatMessage[] = [];

export const addMessage = (msg: ChatMessage) => {
  chatHistory.push(msg);
};

export const getRecentHistory = (limit = 6) => {
  return chatHistory.slice(-limit);
};