"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import ChatArea from "@/components/layout/ChatArea"

export default function Home() {
  const { createSession, activeSessionId, sessions } = useStore()

  // On first load, create a session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession()
    }
  }, [])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  )
}
