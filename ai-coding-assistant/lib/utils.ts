import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ChatMessage, CodeBlock } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + "…"
}

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    })
  }
  return blocks
}

export function generateSessionTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/```[\s\S]*?```/g, "").trim()
  return truncate(cleaned, 40) || "New Chat"
}

export function buildSystemPrompt(level: string, name?: string): string {
  const levelGuides: Record<string, string> = {
    beginner:
      "The user is a beginner. Use simple language, avoid jargon, explain everything step by step, give lots of examples. Never assume prior knowledge.",
    intermediate:
      "The user has some programming experience. You can use technical terms but still explain concepts clearly. Give practical examples.",
    advanced:
      "The user is experienced. Be concise, use technical language freely, focus on depth and edge cases.",
  }

  return `You are a highly skilled AI coding and learning assistant. Your goal is to help users understand programming concepts, debug code, and build projects step by step.

${name ? `The user's name is ${name}.` : ""}
${levelGuides[level] || levelGuides.beginner}

Core behaviors:
- Always explain WHY, not just what
- When showing code, always add inline comments
- For bugs: identify the exact problem, explain why it's a bug, then show the fix
- Break complex topics into numbered steps
- Use analogies to explain abstract concepts
- If the user seems stuck, ask a guiding question instead of giving the full answer
- Adapt your explanation depth based on the user's follow-up questions
- When someone asks to build something, give a structured plan first

Formatting rules:
- Use markdown code blocks with language labels (e.g. \`\`\`python)
- Use **bold** for important terms
- Use numbered lists for steps
- Keep responses focused and clear — no filler text
- End complex explanations with "Does this make sense? Want me to go deeper on any part?"

Remember: You are a patient teacher, not just a code generator.`
}
