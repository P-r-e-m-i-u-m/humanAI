# 🤖 AI Coding Assistant

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

A dark-themed AI coding and learning assistant powered by **Qwen3** (Alibaba Cloud). It helps you understand programming concepts, debug code, and build projects step by step — with memory that adapts to your skill level over time.

---

## ✨ Features

- 💬 **Chat interface** — WhatsApp-style bubbles, smooth animations
- 🧠 **Memory & personalization** — remembers your level (beginner/intermediate/advanced)
- 🗂️ **Sidebar history** — all past chats saved to localStorage
- 💻 **Code highlighting** — syntax-highlighted code blocks with copy button
- ⚡ **Streaming responses** — real-time token-by-token output
- 🛑 **Stop button** — cancel generation mid-stream
- 🌙 **Dark theme** — easy on the eyes, built for devs

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/P-r-e-m-i-u-m/ai-coding-assistant.git
cd ai-coding-assistant
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Qwen API key:
```env
QWEN_API_KEY=your_key_here
QWEN_MODEL=qwen-plus
```

**Get your Qwen API key:** https://dashscope.aliyuncs.com → Sign up → API Keys

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
ai-coding-assistant/
├── app/
│   ├── api/chat/route.ts        ← Qwen streaming API route
│   ├── globals.css              ← Dark theme CSS variables
│   ├── layout.tsx
│   └── page.tsx                 ← Main page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          ← Chat history + level selector
│   │   ├── Topbar.tsx           ← Header bar
│   │   └── ChatArea.tsx         ← Message list + streaming logic
│   └── ui/
│       ├── MessageBubble.tsx    ← Chat bubble with code highlighting
│       ├── ChatInput.tsx        ← Textarea + send button
│       └── WelcomeScreen.tsx    ← Empty state with starter prompts
├── lib/
│   ├── store.ts                 ← Zustand store (persisted)
│   └── utils.ts                 ← Helpers + system prompt builder
├── types/
│   └── index.ts                 ← All TypeScript types
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔑 API Keys

| Provider | Get key at | Free tier |
|---|---|---|
| Qwen (Alibaba Cloud) | [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com) | Free credits on signup |

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com) → New Project
3. Add environment variables:
   - `QWEN_API_KEY`
   - `QWEN_MODEL` = `qwen-plus`
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL
4. Deploy ✅

---

## 👤 Author

- GitHub: [@P-r-e-m-i-u-m](https://github.com/P-r-e-m-i-u-m)
- LinkedIn: [Syed Abdul Aman](https://linkedin.com/in/syedabdul-aman-genai-developer)
