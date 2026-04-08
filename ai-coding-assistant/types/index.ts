export type MessageRole = "user" | "assistant" | "system"

export type UserLevel = "beginner" | "intermediate" | "advanced"

export type MessageType = "text" | "code" | "error" | "thinking"

export interface CodeBlock {
  language: string
  code: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  isStreaming?: boolean
  codeBlocks?: CodeBlock[]
  type?: MessageType
}

export interface UserMemory {
  level: UserLevel
  name?: string
  topics: string[]
  lastActive: string
  messageCount: number
  preferredLanguages: string[]
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface AppState {
  sessions: ChatSession[]
  activeSessionId: string | null
  memory: UserMemory
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean
}

export interface SendMessageRequest {
  messages: { role: MessageRole; content: string }[]
  memory: UserMemory
}

export interface SendMessageResponse {
  reply: string
  updatedMemory?: Partial<UserMemory>
}
