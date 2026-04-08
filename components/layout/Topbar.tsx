"use client"

import { PanelLeft, Github, Code2 } from "lucide-react"
import { useStore } from "@/lib/store"

const LEVEL_COLORS = {
  beginner:     { bg: "rgba(61,214,140,0.1)",   color: "#3dd68c", border: "rgba(61,214,140,0.2)"   },
  intermediate: { bg: "rgba(212,168,67,0.12)",  color: "#d4a843", border: "rgba(212,168,67,0.25)"  },
  advanced:     { bg: "rgba(168,154,204,0.12)", color: "#a89acc", border: "rgba(168,154,204,0.25)" },
}

export default function Topbar() {
  const { toggleSidebar, sidebarOpen, memory, activeSessionId, sessions } = useStore()
  const activeSession = sessions.find(s => s.id === activeSessionId)
  const lc = LEVEL_COLORS[memory.level]

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px", height: "48px", flexShrink: 0,
      background: "var(--bg-primary)",
      borderBottom: "1px solid var(--border)",
    }}>

      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={toggleSidebar}
          style={{
            width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "7px", cursor: "pointer", background: "transparent", border: "none",
            color: sidebarOpen ? "var(--accent-gold)" : "var(--text-muted)",
            transition: "all 0.15s ease",
          }}
          className="hover:bg-white/5"
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>

        {/* Logo — only when sidebar closed */}
        {!sidebarOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "26px", height: "26px", borderRadius: "7px",
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Code2 size={13} color="var(--accent-gold)" />
            </div>
            <span style={{ fontSize: "14px" }}>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Code</span>
              <span style={{ fontWeight: 500, color: "var(--taupe)" }}>AI</span>
            </span>
          </div>
        )}

        {/* Active chat title */}
        {activeSession && (
          <span style={{
            fontSize: "13px", color: "var(--text-muted)",
            borderLeft: "1px solid var(--border)", paddingLeft: "10px", marginLeft: "2px",
            maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
            className="hidden sm:block"
          >
            {activeSession.title}
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          className="level-badge hidden sm:inline-flex"
          style={{ background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}
        >
          {memory.level}
        </span>

        <a
          href="https://github.com/P-r-e-m-i-u-m"
          target="_blank" rel="noopener noreferrer"
          style={{
            width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "7px", color: "var(--text-muted)", textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          className="hover:bg-white/5"
        >
          <Github size={15} />
        </a>
      </div>
    </header>
  )
}