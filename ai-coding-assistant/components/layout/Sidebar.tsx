"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare, Trash2, ChevronRight,
  Users, Search, Clock, X, Code2,
  Sun, Moon, Monitor,
  PlusCircle
} from "lucide-react"
import { useStore } from "@/lib/store"
import { cn, formatDate } from "@/lib/utils"
import type { UserLevel } from "@/types"

type Theme = "system" | "light" | "dark"

const LEVEL_COLORS: Record<UserLevel, { bg: string; color: string; border: string }> = {
  beginner:     { bg: "rgba(61,214,140,0.1)",   color: "#3dd68c", border: "rgba(61,214,140,0.2)"   },
  intermediate: { bg: "rgba(212,168,67,0.12)",  color: "#d4a843", border: "rgba(212,168,67,0.25)"  },
  advanced:     { bg: "rgba(168,154,204,0.12)", color: "#a89acc", border: "rgba(168,154,204,0.25)" },
}

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "system", icon: Monitor, label: "System" },
  { value: "light",  icon: Sun,     label: "Light"  },
  { value: "dark",   icon: Moon,    label: "Dark"   },
]

export default function Sidebar() {
  const {
    sessions, activeSessionId, memory, sidebarOpen,
    createSession, deleteSession, setActiveSession, setSidebarOpen,
    setUserLevel,
  } = useStore()

  const [search, setSearch]       = useState("")
  const [showAll, setShowAll]     = useState(false)
  const [theme, setTheme]         = useState<Theme>("system")
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  const handleTheme = (t: Theme) => {
    setTheme(t)
    const root = document.documentElement
    if (t === "light") root.setAttribute("data-theme", "light")
    else root.removeAttribute("data-theme")
  }

  const filtered = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )
  const visible = showAll ? filtered : filtered.slice(0, 5)
  const levels: UserLevel[] = ["beginner", "intermediate", "advanced"]

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -272, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -272, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "272px",
            background: "var(--bg-primary)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* ── Logo row ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 10px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Code2 size={15} color="var(--accent-gold)" />
              </div>
              <span style={{ fontSize: "15px", letterSpacing: "-0.01em" }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Code</span>
                <span style={{ fontWeight: 500, color: "var(--taupe)" }}>AI</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", cursor: "pointer", background: "transparent", border: "none", color: "var(--text-muted)" }}
              className="hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* ── New Chat ── */}
          <div style={{ padding: "0 12px 10px", flexShrink: 0 }}>
            <button
              onClick={() => createSession()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <PlusCircle size={16} />
              New Chat
            </button>
          </div>

          {/* ── Level selector ── */}
          <div style={{ padding: "0 12px 10px", flexShrink: 0 }}>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px", paddingLeft: "2px" }}>
              Your Level
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {levels.map(lvl => {
                const c = LEVEL_COLORS[lvl]
                const active = memory.level === lvl
                return (
                  <button key={lvl} onClick={() => setUserLevel(lvl)}
                    style={{
                      flex: 1, padding: "6px 0", fontSize: "11px", fontWeight: 500,
                      borderRadius: "6px", cursor: "pointer", textTransform: "capitalize",
                      background: active ? c.bg : "transparent",
                      border: `1px solid ${active ? c.border : "var(--border)"}`,
                      color: active ? c.color : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lvl.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="divider" style={{ flexShrink: 0 }} />

          {/* ── Chat History — takes all remaining space ── */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "8px 12px 0" }}>

            {/* Search — only shown when > 3 sessions */}
            {sessions.length > 3 && (
              <div style={{ position: "relative", marginBottom: "8px", flexShrink: 0 }}>
                <Search size={12} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  style={{
                    width: "100%", padding: "7px 9px 7px 28px", borderRadius: "7px",
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: "12.5px", outline: "none",
                  }}
                />
              </div>
            )}

            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "5px", paddingLeft: "2px", flexShrink: 0 }}>
              Recent
            </p>

            {/* ── Scrollable session list ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {visible.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                  No chats yet
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {visible.map(session => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("sidebar-item group", activeSessionId === session.id && "active")}
                      onClick={() => setActiveSession(session.id)}
                    >
                      <div className="sidebar-item-left" style={{ minWidth: 0, flex: 1 }}>
                        <MessageSquare size={13} style={{ flexShrink: 0, color: activeSessionId === session.id ? "var(--accent-gold)" : "var(--text-muted)" }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                            {session.title}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={9} />
                            {formatDate(session.updatedAt)} · {session.messageCount} msgs
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSession(session.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "5px", border: "none", background: "transparent", cursor: "pointer", color: "var(--accent-red)", flexShrink: 0 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* See all / collapse */}
              {filtered.length > 5 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  style={{
                    width: "100%", padding: "7px", marginTop: "4px", borderRadius: "7px",
                    fontSize: "12px", color: "var(--accent-gold)", background: "rgba(212,168,67,0.06)",
                    border: "1px solid rgba(212,168,67,0.15)", cursor: "pointer",
                  }}
                >
                  {showAll ? "Show less" : `See all ${filtered.length} chats`}
                </button>
              )}
            </div>
          </div>

          {/* ── Bottom section — fixed at bottom ── */}
          <div style={{ flexShrink: 0 }}>
            <div className="divider" style={{ margin: "8px 0" }} />

            {/* About Us */}
            <Link
              href="/about"
              className="sidebar-item"
              style={{ width: "100%", textDecoration: "none" }}
            >
              <div className="sidebar-item-left">
                <Users size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <span>About Us</span>
              </div>
              <ChevronRight size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </Link>

            <div className="divider" style={{ margin: "8px 0" }} />

            {/* Theme switcher */}
            <div
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "4px 14px" }}
            >
              <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>
                Theme
              </p>
              <ChevronRight
                size={10}
                style={{ color: "var(--text-muted)", transition: "transform 0.2s", transform: isThemeOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </div>

            <AnimatePresence>
              {isThemeOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", padding: "0 2px 4px" }}
                >
                  {THEME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleTheme(opt.value)}
                      className={cn("theme-btn", theme === opt.value && "active")}
                    >
                      <opt.icon size={13} style={{ flexShrink: 0 }} />
                      <span>{opt.label}</span>
                      {theme === opt.value && (
                        <span style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-gold)", flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.aside>
      )}
    </AnimatePresence>
  )
}