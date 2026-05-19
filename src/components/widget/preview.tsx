"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Loader2, Send, X, MessageCircle } from "lucide-react"

interface WidgetConfig {
  agent_name: string
  accent_color: string
  greeting: string
  theme: string
  avatar_url: string | null
}

interface PreviewProps {
  workspaceId: string
  accentColor: string
  greeting: string
}

export default function WidgetPreview({ workspaceId, accentColor, greeting }: PreviewProps) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<{ text: string; role: string }[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const sessionRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  )
  const bodyRef = useRef<HTMLDivElement>(null)
  const inpRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/widget/config?id=" + workspaceId)
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .catch(() => {})
  }, [workspaceId])

  useEffect(() => {
    if (open && config && msgs.length === 0) {
      setMsgs([{ text: config.greeting || greeting, role: "bot" }])
    }
  }, [open, config, greeting, msgs.length])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [msgs])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setSending(true)
    setMsgs((prev) => [...prev, { text, role: "user" }])

    try {
      const res = await fetch("/api/widget/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_token: sessionRef.current,
          message: text,
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMsgs((prev) => [...prev, { text: data.reply, role: "bot" }])
      }
    } catch {
      setMsgs((prev) => [...prev, { text: "Connection error. Try again.", role: "bot" }])
    }
    setSending(false)
  }, [input, sending, workspaceId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const color = config?.accent_color || accentColor
  const name = config?.agent_name || "Support"
  const c = color

  return (
    <div className="relative w-[360px]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          style={{ background: c }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ background: c }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold flex-1">{name}</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words ${
                  m.role === "user"
                    ? "ml-auto text-white rounded-br-md"
                    : "mr-auto bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                }`}
                style={m.role === "user" ? { background: c } : undefined}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="mr-auto bg-white text-gray-400 border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin mt-0.5" />
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
            <textarea
              ref={inpRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[36px] max-h-24 focus:border-gray-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="rounded-lg w-9 h-9 flex items-center justify-center text-white disabled:opacity-40"
              style={{ background: c }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
