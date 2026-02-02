# AI Portfolio Chatbot 🤖  
An interactive AI-powered portfolio chatbot designed as a conversational alternative to a traditional portfolio.
The chatbot integrates AI through an **intent-driven, knowledge-grounded response system** rather than a large language model.
It allows users to **chat**, **upload files**, and **share images** to explore Faustina Yarathingal’s skills, projects, background, and tech stack in real time.

🔗 Live Demo: https://frosty3316.github.io/ai-chatbot/  
🔌 Server: https://ai-chatbot-opez.onrender.com

---

## ✨ Features

- Conversational AI chat interface
- File upload support (documents, PDFs, text files)
- Image upload and preview inside chat
- Portfolio-aware responses (skills, projects, background, tech stack)
- Contextual replies based on uploaded content
- Fully responsive (desktop + mobile)
- Optimized frontend performance
- Deployed and publicly accessible

---

## 🧠 Architecture Overview

The AI Portfolio Chatbot follows a decoupled client–server architecture.

### Client
- React (Vite)
- TypeScript
- Custom chat UI
- File & image upload handling
- Responsive CSS layout

### Server
- Node.js + Express
- TypeScript
- Structured portfolio data source
- REST-based chat API

### Communication
- HTTP-based API communication
- Client sends:
  - text prompts
  - uploaded files
  - uploaded images
- Server processes input and returns contextual responses

---

## 🔁 Data Flow

1. User opens the chatbot interface
2. User sends a message or uploads a file/image
3. Client sends request to `/chat` endpoint
4. Server:
   - parses user input
   - matches intent against portfolio data
5. Server sends a generated response
6. Client renders the response inline in the chat UI

---

## ⚖️ Design Decisions & Tradeoffs

### Why a rule-based portfolio responder?
The chatbot uses structured portfolio data instead of a large language model to ensure:
- deterministic responses
- factual accuracy
- fast response times
- low deployment complexity

### Why file and image uploads?
Uploads allow:
- richer user interaction
- contextual exploration of content
- a more engaging portfolio experience
Uploaded files and images are treated as **contextual input**, allowing the chatbot to adapt the conversation flow and acknowledge or incorporate user-provided content. This enables multi-modal interaction without introducing heavyweight AI dependencies.

### Why REST instead of WebSockets?
The interaction model is request–response focused, making REST:
- simpler to deploy
- easier to debug
- sufficient for the project’s scope

---

## 📌 Scope Justification

This project focuses on:
- conversational UX
- real-world deployment
- frontend performance
- clean client–server separation

Rather than:
- complex NLP pipelines
- generative AI models
- persistent user sessions

---

## 🚀 Deployment

- Frontend: GitHub Pages (via GitHub Actions)
- Backend: Render
- Decoupled production deployment
- Backend configured with dynamic ports

---

## 🧪 Running Locally

The project is fully deployed and can be used directly via the live demo.  
Running locally is intended for developers or reviewers who want to inspect, debug, or extend the system.

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Future Improvements

The architecture is intentionally designed to be **LLM-ready**.
- LLM-powered responses
- Persistent chat history
- User authentication
- Document and image understanding
- Conversation memory
This allows the system to evolve toward generative AI while preserving its current reliability.

---

## 🏁 Conclusion

The AI Portfolio Chatbot demonstrates how a traditional portfolio can be transformed into an interactive, conversational experience, emphasizing deployment, UX, and practical system design.

---

## 📐 Architecture Diagram

Client (React)  
   │  
   │ HTTP (REST API)  
   ▼  
Server (Node.js + Express)  
   │  
   └─ Portfolio Data & Response Logic  
