# Dossier

A GPT-style portfolio assistant for [Faustina Yarathingal](https://frosty3316.github.io/portfolio-site). Questions about her work are answered from a structured source and are unlimited. General questions go through a hosted model, with no visitor sign-in and a daily cap.

**Live:** [dossier-pink.vercel.app](https://dossier-pink.vercel.app)

## How it works

- **Portfolio** — retrieval from `client/src/data/portfolio.json` (and the same file on the Express fallback). No model, no key, no limit. Stack answers stay grouped (languages, frontend, backend, AI, forensics, tools, spoken languages) instead of one flat list.
- **General** — `POST /api/chat` calls [Groq](https://console.groq.com) from a Vercel Function (`openai/gpt-oss-20b` for text, `qwen/qwen3.6-27b` when an image is attached). The key is `GROQ_API_KEY` on the server only — never `VITE_`, never in the browser. Visitors never see a key or a sign-in screen. You can attach photos and common files (PDF, text, code) to a general question.
- **Caps** — 8 general questions / 24h per browser, plus a matching IP bucket on the function and a 15s cooldown. The function reserves a slot before calling Groq and refunds it if the model fails. Serverless instances do not share that bucket, so it is a cost guardrail, not a hard global lock.
- **Memory** — chats persist in `localStorage`. Right-click a title (or the ⋮ control) to rename, pin, or delete. Ctrl/Cmd-click selects several chats so you can pin or delete them together. Pinned chats stay at the top.

The Vite UI is the Vercel app root (`client/`). The Express `server/` is a local fallback, not what production uses.

## Run locally

```bash
cd client
npm install
npm run dev
```

`npm run dev` is UI-only. Portfolio answers work; general chat needs the function:

```bash
cd client
npm run dev:full
```

That runs `vercel dev` so `/api/chat` is available on your machine.

## Hosting

Set `GROQ_API_KEY` on the Vercel project (Production and Preview). Do not commit it. Local general chat needs the same name in a gitignored `client/.env.local`.

If you change portfolio facts, update both `client/src/data/portfolio.json` and `server/src/data/portfolio.json`, plus `client/api/_lib/prompt.ts` so the general model stays aligned.
