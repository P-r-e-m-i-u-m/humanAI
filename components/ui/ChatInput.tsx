"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import {
  ArrowRight, Square, Mic, MicOff, Plus, X,
  FileCode, FileImage, FileText, RefreshCw,
  Zap, Bug, BookOpen, Wrench
} from "lucide-react"

export interface AttachedFile {
  id: string
  name: string
  type: "image" | "code" | "pdf" | "other"
  // For images: base64 data URI (data:image/png;base64,...)
  // For text/code/pdf: raw text content
  content: string
  mimeType?: string   // e.g. "image/png" — only set for images
  preview?: string    // thumbnail data URI for display
}

interface Props {
  onSend: (text: string, files?: AttachedFile[]) => void
  isLoading: boolean
  onStop?: () => void
  onRegenerate?: () => void
  canRegenerate?: boolean
  disabled?: boolean
  hideChips?: boolean
  hideFooter?: boolean
}

const SUGGEST_CHIPS = [
  { icon: Bug,      label: "Fix this code",  prompt: "Fix the bug in this code and explain what was wrong:" },
  { icon: BookOpen, label: "Explain this",   prompt: "Explain this in simple terms:" },
  { icon: Zap,      label: "Make it faster", prompt: "Optimize this code for better performance:" },
  { icon: Wrench,   label: "Best practices", prompt: "Review this code and suggest best practices:" },
]

function getFileIcon(type: AttachedFile["type"]) {
  if (type === "image") return FileImage
  if (type === "code")  return FileCode
  return FileText
}

function detectFileType(file: File): AttachedFile["type"] {
  if (file.type.startsWith("image/")) return "image"
  if (file.type === "application/pdf") return "pdf"
  const codeExts = [".ts",".tsx",".js",".jsx",".py",".java",".cpp",".c",".go",".rs",".php",".rb",".swift",".kt",".css",".html",".json",".yaml",".yml",".sh"]
  if (codeExts.some(ext => file.name.endsWith(ext))) return "code"
  return "other"
}

export default function ChatInput({
  onSend, isLoading, onStop, onRegenerate, canRegenerate, disabled, hideChips, hideFooter
}: Props) {
  const [value, setValue]           = useState("")
  const [files, setFiles]           = useState<AttachedFile[]>([])
  const [isListening, setListening] = useState(false)
  const [showPlus, setShowPlus]     = useState(false)
  const [dragOver, setDragOver]     = useState(false)

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px"
  }, [value])

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<string>
      setValue(ev.detail)
      textareaRef.current?.focus()
    }
    window.addEventListener("suggest", handler)
    return () => window.removeEventListener("suggest", handler)
  }, [])

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert("Voice input not supported. Use Chrome."); return }
    const r = new SR()
    r.lang = "en-US"; r.continuous = false; r.interimResults = true
    r.onresult = (e: any) => setValue(Array.from(e.results).map((x: any) => x[0].transcript).join(""))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recognitionRef.current = r
    r.start(); setListening(true)
  }

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false) }

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)   // full data URI: "data:image/png;base64,..."
      r.onerror = () => rej(new Error("Read failed"))
      r.readAsDataURL(file)
    })

  const readAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.onerror = () => rej(new Error("Read failed"))
      r.readAsText(file)
    })

  const handleFiles = async (fileList: FileList) => {
    const newFiles: AttachedFile[] = []

    for (const file of Array.from(fileList)) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} too large. Max 10MB.`); continue }

      const type = detectFileType(file)

      if (type === "image") {
        const dataUri = await readAsBase64(file)
        newFiles.push({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: "image",
          content: dataUri,          // full data URI stored here
          mimeType: file.type,       // e.g. "image/jpeg"
          preview: dataUri,          // same URI used for thumbnail
        })
      } else {
        // PDF, code, text — read as text
        let text = ""
        try { text = await readAsText(file) } catch { text = `[Could not read ${file.name}]` }
        newFiles.push({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type,
          content: text,
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
    setShowPlus(false)
  }

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const send = () => {
    const text = value.trim()
    if ((!text && files.length === 0) || isLoading) return
    const snapshot = [...files]
    setValue(""); setFiles([])
    onSend(text, snapshot)   // pass files separately — ChatArea builds the content array
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="px-4 pb-4 pt-1">

      {/* Suggest chips */}
      {!hideChips && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {SUGGEST_CHIPS.map(chip => (
            <button key={chip.label}
              onClick={() => { setValue(chip.prompt); textareaRef.current?.focus() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap flex-shrink-0 transition-all hover:scale-105"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <chip.icon size={11} style={{ color: "var(--accent-blue)" }} />
              {chip.label}
            </button>
          ))}
          {canRegenerate && (
            <button onClick={onRegenerate} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap flex-shrink-0 transition-all hover:scale-105"
              style={{ background: "rgba(157,124,255,0.1)", border: "1px solid rgba(157,124,255,0.25)", color: "var(--accent-purple)" }}
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          )}
        </div>
      )}

      {/* Attached files preview */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {files.map(f => {
            const Icon = getFileIcon(f.type)
            return (
              <div key={f.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] relative group"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-secondary)", maxWidth: "160px" }}
              >
                {f.preview
                  ? <img src={f.preview} alt={f.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                  : <Icon size={13} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
                }
                <span className="truncate">{f.name}</span>
                <button onClick={() => removeFile(f.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--accent-red)" }}
                >
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input box */}
      <div
        className="flex items-end gap-2 p-2 rounded-2xl transition-all"
        style={{ background: "var(--bg-secondary)", border: `1px solid ${dragOver ? "rgba(91,164,255,0.4)" : "var(--border)"}` }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden"
          accept="image/*,.pdf,.ts,.tsx,.js,.jsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.css,.html,.json,.yaml,.yml,.sh,.txt,.md"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        {/* Plus button */}
        <div className="relative mb-1">
          <button onClick={() => setShowPlus(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white/5"
            style={{ color: showPlus ? "var(--accent-blue)" : "var(--text-muted)" }}
            title="Attach file"
          >
            <Plus size={17} />
          </button>

          {showPlus && (
            <div className="absolute bottom-10 left-0 rounded-xl overflow-hidden z-50 min-w-[175px]"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
            >
              {[
                { icon: FileImage, label: "Upload image",      accept: "image/*" },
                { icon: FileCode,  label: "Upload code file",  accept: ".ts,.tsx,.js,.jsx,.py,.java,.cpp,.go,.rs,.rb,.swift,.kt,.php,.sh" },
                { icon: FileText,  label: "Upload PDF / text", accept: ".pdf,.txt,.md,.json,.yaml,.yml,.csv" },
              ].map(item => (
                <button key={item.label}
                  onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = item.accept; fileInputRef.current.click() } }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-left transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <item.icon size={14} style={{ color: "var(--accent-blue)" }} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea ref={textareaRef} value={value} onChange={e => setValue(e.target.value)} onKeyDown={onKeyDown}
          placeholder={isListening ? "🎤 Listening..." : "What are you working on~"}
          rows={1} disabled={disabled}
          className="flex-1 bg-transparent outline-none resize-none text-sm py-1.5"
          style={{ color: isListening ? "var(--accent-green)" : "var(--text-primary)", minHeight: "36px", maxHeight: "180px", fontStyle: isListening ? "italic" : "normal" }}
        />

        {/* Voice */}
        <button onClick={isListening ? stopVoice : startVoice}
          className="mb-1 w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white/5 flex-shrink-0"
          style={{ color: isListening ? "var(--accent-green)" : "var(--text-muted)" }}
        >
          {isListening ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        {/* Send / Stop */}
        {isLoading
          ? <button onClick={onStop} className="mb-1 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-red)", color: "#fff" }}>
              <Square size={14} fill="white" />
            </button>
          : <button onClick={send} disabled={(!value.trim() && files.length === 0) || disabled}
              className="mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-white/10 hover:border-white/20 hover:bg-white/5"
            >
              <ArrowRight size={16} className="text-white" />
            </button>
        }
      </div>

      {!hideFooter && (
        <p className="text-center text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
          Drag & drop files · Voice input (Chrome) · Max 10MB
        </p>
      )}
    </div>
  )
}