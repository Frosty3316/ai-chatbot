const chatHistory = [];
export const addMessage = (msg) => {
    chatHistory.push(msg);
};
export const getRecentHistory = (limit = 6) => {
    return chatHistory.slice(-limit);
};
