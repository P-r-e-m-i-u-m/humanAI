"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check, Bot, User } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn, formatTime } from "@/lib/utils"
import type { ChatMessage } from "@/types"

interface Props {
  message: ChatMessage
  isLast?: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-all hover:bg-white/10"
      style={{ color: copied ? "var(--accent-green)" : "var(--text-muted)" }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

function renderContent(content: string, isStreaming?: boolean) {
  const parts: React.ReactNode[] = []
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <MarkdownText key={key++} text={content.slice(lastIndex, match.index)} />
      )
    }
    const lang = match[1] || "text"
    const code = match[2].trim()
    parts.push(
      <div key={key++} className="my-3 rounded-lg overflow-hidden code-block">
        <div className="code-lang-badge">
          <span>{lang}</span>
          <CopyButton text={code} />
        </div>
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "14px 16px",
            background: "#0a0d14",
            fontSize: "13px",
            lineHeight: "1.7",
          }}
          showLineNumbers={code.split("\n").length > 5}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(
      <MarkdownText
        key={key++}
        text={content.slice(lastIndex)}
        streaming={isStreaming}
      />
    )
  }

  return parts
}

function MarkdownText({ text, streaming }: { text: string; streaming?: boolean }) {
  // Very simple markdown: bold, inline code, headers, lists
  const lines = text.split("\n")
  return (
    <div className={cn("prose-dark", streaming && "stream-cursor")}>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>
        if (line.startsWith("## "))  return <h2 key={i}>{line.slice(3)}</h2>
        if (line.startsWith("# "))   return <h1 key={i}>{line.slice(2)}</h1>
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        }
        const numMatch = line.match(/^(\d+)\. (.*)/)
        if (numMatch) {
          return <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
        }
        if (line.startsWith("> ")) {
          return <blockquote key={i}>{line.slice(2)}</blockquote>
        }
        if (line === "---" || line === "***") return <hr key={i} />
        if (line === "") return <br key={i} />
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      })}
    </div>
  )
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
}

export default function MessageBubble({ message, isLast }: Props) {
  const isUser = message.role === "user"
  const isThinking = message.isStreaming && !message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-3 px-4 py-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser
            ? "bg-blue-600/30 border border-blue-500/30"
            : "bg-emerald-600/20 border border-emerald-500/20"
        )}
      >
        {isUser
          ? <User size={14} style={{ color: "var(--accent-blue)" }} />
          : <Bot size={14} style={{ color: "var(--accent-green)" }} />
        }
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[75%] flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div className={cn("px-4 py-3 text-sm", isUser ? "bubble-user" : "bubble-ai")}>
          {isThinking ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          ) : (
            <div className={cn(isUser ? "text-[color:var(--text-primary)]" : "")}>
              {isUser
                ? <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
                : renderContent(message.content, message.isStreaming)
              }
            </div>
          )}
        </div>

        {/* Timestamp + copy */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {formatTime(message.timestamp)}
          </span>
          {!isUser && message.content && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
