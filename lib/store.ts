"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ChatSession, ChatMessage, UserMemory, UserLevel } from "@/types"
import { generateId, generateSessionTitle } from "@/lib/utils"

interface StoreState {
  sessions: ChatSession[]
  activeSessionId: string | null
  memory: UserMemory
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean

  // Session actions
  createSession: () => string
  deleteSession: (id: string) => void
  setActiveSession: (id: string) => void
  getActiveSession: () => ChatSession | null

  // Message actions
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => string
  updateMessage: (sessionId: string, messageId: string, content: string) => void
  setMessageStreaming: (sessionId: string, messageId: string, streaming: boolean) => void

  // Memory actions
  updateMemory: (updates: Partial<UserMemory>) => void
  setUserLevel: (level: UserLevel) => void
  addTopic: (topic: string) => void

  // UI actions
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

const defaultMemory: UserMemory = {
  level: "beginner",
  topics: [],
  lastActive: new Date().toISOString(),
  messageCount: 0,
  preferredLanguages: [],
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      memory: defaultMemory,
      isLoading: false,
      error: null,
      sidebarOpen: true,

      createSession: () => {
        const id = generateId()
        const newSession: ChatSession = {
          id,
          title: "New Chat",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        }
        set((s) => ({
          sessions: [newSession, ...s.sessions],
          activeSessionId: id,
        }))
        return id
      },

      deleteSession: (id) => {
        set((s) => {
          const remaining = s.sessions.filter((s) => s.id !== id)
          return {
            sessions: remaining,
            activeSessionId:
              s.activeSessionId === id
                ? remaining[0]?.id ?? null
                : s.activeSessionId,
          }
        })
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id })
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        return sessions.find((s) => s.id === activeSessionId) ?? null
      },

      addMessage: (sessionId, message) => {
        const id = generateId()
        const fullMessage: ChatMessage = {
          ...message,
          id,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({
          sessions: s.sessions.map((session) => {
            if (session.id !== sessionId) return session
            const messages = [...session.messages, fullMessage]
            const title =
              session.messageCount === 0 && message.role === "user"
                ? generateSessionTitle(message.content)
                : session.title
            return {
              ...session,
              messages,
              title,
              messageCount: messages.length,
              updatedAt: new Date().toISOString(),
            }
          }),
          memory: {
            ...s.memory,
            messageCount: s.memory.messageCount + 1,
            lastActive: new Date().toISOString(),
          },
        }))
        return id
      },

      updateMessage: (sessionId, messageId, content) => {
        set((s) => ({
          sessions: s.sessions.map((session) => {
            if (session.id !== sessionId) return session
            return {
              ...session,
              messages: session.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content } : msg
              ),
            }
          }),
        }))
      },

      setMessageStreaming: (sessionId, messageId, streaming) => {
        set((s) => ({
          sessions: s.sessions.map((session) => {
            if (session.id !== sessionId) return session
            return {
              ...session,
              messages: session.messages.map((msg) =>
                msg.id === messageId ? { ...msg, isStreaming: streaming } : msg
              ),
            }
          }),
        }))
      },

      updateMemory: (updates) => {
        set((s) => ({ memory: { ...s.memory, ...updates } }))
      },

      setUserLevel: (level) => {
        set((s) => ({ memory: { ...s.memory, level } }))
      },

      addTopic: (topic) => {
        set((s) => {
          const topics = Array.from(new Set([...s.memory.topics, topic])).slice(-20)
          return { memory: { ...s.memory, topics } }
        })
      },

      setLoading: (v) => set({ isLoading: v }),
      setError: (v) => set({ error: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
    }),
    {
      name: "ai-coding-assistant-state",
      // ── KEY FIX: Skip saving to localStorage while any message is streaming ──
      // This prevents hundreds of localStorage writes per second during generation
      partialize: (s) => {
        const isStreaming = s.sessions.some((session) =>
          session.messages.some((msg) => msg.isStreaming)
        )

        return {
          // If streaming → save sessions without the in-progress streaming message
          // This avoids spamming localStorage on every chunk
          sessions: isStreaming
            ? s.sessions.map((session) => ({
                ...session,
                messages: session.messages.filter((msg) => !msg.isStreaming),
              }))
            : s.sessions,
          activeSessionId: s.activeSessionId,
          memory: s.memory,
          sidebarOpen: s.sidebarOpen,
        }
      },
    }
  )
)