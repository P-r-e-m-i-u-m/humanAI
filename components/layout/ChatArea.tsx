"use client"

import { useEffect, useRef, useCallback } from "react"
import { useStore } from "@/lib/store"
import MessageBubble from "@/components/ui/MessageBubble"
import ChatInput from "@/components/ui/ChatInput"
import type { AttachedFile } from "@/components/ui/ChatInput"
import WelcomeScreen from "@/components/ui/WelcomeScreen"

const abortControllers = new Map<string, AbortController>()

// ─── Build the content array that goes to the API ───────────────────────────
// For plain text messages:  content = "hello"
// For messages with files:  content = [ {type:"text", text:"..."}, {type:"image_url",...}, ... ]
function buildContent(text: string, files: AttachedFile[]): string | Array<unknown> {
  if (files.length === 0) return text || ""

  const imageFiles = files.filter(f => f.type === "image")
  const otherFiles = files.filter(f => f.type !== "image")

  const parts: Array<unknown> = []

  // Non-image file contents as fenced code blocks
  const textParts: string[] = []
  for (const f of otherFiles) {
    const ext = f.name.split(".").pop() ?? "txt"
    const lang = f.type === "code" ? ext : "text"
    const body = f.content.slice(0, 12_000)
    textParts.push(`File: ${f.name}\n\`\`\`${lang}\n${body}\n\`\`\``)
  }

  // Build the text block — if images are attached, add a strong instruction
  // so the model focuses on the ATTACHED image, not anything from prior context
  let userText = text || ""
  if (imageFiles.length > 0) {
    const imageNote = imageFiles.length === 1
      ? `[The user has attached 1 image. You MUST look at and describe ONLY the image attached in this message. Do NOT reference or describe any previous images from earlier in the conversation.]\n\nUser's question about the attached image: ${userText || "What is in this image?"}`
      : `[The user has attached ${imageFiles.length} images. You MUST look at and describe ONLY the images attached in this message. Do NOT reference any previous images.]\n\nUser's question: ${userText || "What is in these images?"}`
    userText = imageNote
  }

  const combinedText = [...textParts, userText].filter(Boolean).join("\n\n")
  if (combinedText) {
    parts.push({ type: "text", text: combinedText })
  }

  // Image blocks — placed AFTER the text instruction
  for (const f of imageFiles) {
    parts.push({
      type: "image_url",
      image_url: { url: f.content },
    })
  }

  return parts.length === 1 && parts[0] && (parts[0] as any).type === "text"
    ? (parts[0] as any).text
    : parts
}

export default function ChatArea() {
  const {
    sessions, activeSessionId, memory,
    addMessage, updateMessage, setMessageStreaming,
    setLoading, isLoading, createSession,
  } = useStore()

  const bottomRef = useRef<HTMLDivElement>(null)
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, messages.at(-1)?.content])

  const handleSend = useCallback(async (text: string, files: AttachedFile[] = []) => {
    let sessionId = activeSessionId
    if (!sessionId) sessionId = createSession()

    // ── 1. Add the user message (always store as plain text in the store for display) ──
    const displayText = [
      text,
      ...files.map(f =>
        f.type === "image"
          ? `📎 ${f.name}`
          : `📄 ${f.name}`
      ),
    ].filter(Boolean).join("\n")

    addMessage(sessionId, { role: "user", content: displayText })

    // ── 2. Add placeholder assistant message ──
    const aiMsgId = addMessage(sessionId, { role: "assistant", content: "", isStreaming: true })
    setLoading(true)

    // ── 3. Build the messages array for the API ──
    // Previous messages (already in store, plain text)
    const session = useStore.getState().sessions.find((s) => s.id === sessionId)!
    const historyMessages = session.messages
      .filter((m) => !m.isStreaming && m.id !== aiMsgId)
      // Remove the last user message we just added (we'll re-add it with files below)
      .slice(0, -1)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    // Current user message — may be multimodal
    const currentContent = buildContent(text, files)
    const allMessages = [
      ...historyMessages,
      { role: "user" as const, content: currentContent },
    ]

    const controller = new AbortController()
    abortControllers.set(aiMsgId, controller)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, memory }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        updateMessage(sessionId, aiMsgId, `❌ Error: ${err.error || "Something went wrong."}`)
        setMessageStreaming(sessionId, aiMsgId, false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")

      let accumulated = ""
      let lastUpdate = 0
      const THROTTLE_MS = 50

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") break
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) accumulated += parsed.content
            } catch { /* skip malformed */ }
          }
        }

        const now = Date.now()
        if (now - lastUpdate >= THROTTLE_MS) {
          updateMessage(sessionId, aiMsgId, accumulated)
          lastUpdate = now
        }
      }

      updateMessage(sessionId, aiMsgId, accumulated)

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        const current = useStore.getState().sessions
          .find((s) => s.id === sessionId)?.messages
          .find((m) => m.id === aiMsgId)?.content
        if (!current) updateMessage(sessionId, aiMsgId, "*(response stopped)*")
      } else {
        updateMessage(sessionId, aiMsgId, "❌ Failed to connect. Check your API key and try again.")
      }
    } finally {
      setMessageStreaming(sessionId, aiMsgId, false)
      setLoading(false)
      abortControllers.delete(aiMsgId)
    }
  }, [activeSessionId, memory, addMessage, updateMessage, setMessageStreaming, setLoading, createSession])

  const handleStop = () => {
    abortControllers.forEach((c) => c.abort())
    abortControllers.clear()
    setLoading(false)
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggest={(t) => handleSend(t)} isLoading={isLoading} onStop={handleStop} />
        ) : (
          <div className="py-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} />
            ))}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          onStop={handleStop}
        />
      )}
    </div>
  )
}