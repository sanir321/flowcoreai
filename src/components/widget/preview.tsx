"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Send, X, MessageSquare, Bot, User, Sparkles, ChevronLeft, ChevronRight, Mail, Phone, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface WidgetConfig {
  header_text: string
  agent_name: string
  greeting: string
  post_form_message: string
  accent_color: string
  theme: string
  logo_url: string | null
  launcher_icon: string
  enable_whatsapp: boolean
  allow_anonymous: boolean
  auto_fill_params: boolean
  default_country: string
  email_notifications: boolean
}

interface PreviewProps {
  workspaceId: string
  view: "start" | "form" | "chat"
  isOpen: boolean
  config: Partial<WidgetConfig>
}

export default function WidgetPreview({ workspaceId, view = "chat", isOpen = true, config: localConfig }: PreviewProps) {
  const [msgs, setMsgs] = useState<{ text: string; role: string }[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [dbConfig, setDbConfig] = useState<WidgetConfig | null>(null)
  const [sessionToken] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  )
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/widget/config?id=" + workspaceId)
      .then((r) => r.json())
      .then((d) => setDbConfig(d))
      .catch(() => {})
  }, [workspaceId])

  const config = { ...dbConfig, ...localConfig } as any

  useEffect(() => {
    if (view === "chat" && msgs.length === 0) {
      setMsgs([{ text: config.greeting || "Hi! How can I help you?", role: "bot" }])
    }
  }, [view, config.greeting, msgs.length])

  useEffect(() => {
    if (bodyRef.current) {
       bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
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
        body: JSON.stringify({ workspace_id: workspaceId, session_token: sessionToken, message: text }),
      })
      const data = await res.json()
      if (data.reply) setMsgs((prev) => [...prev, { text: data.reply, role: "bot" }])
    } catch {
      setMsgs((prev) => [...prev, { text: "Error. Try again.", role: "bot" }])
    }
    setSending(false)
  }, [input, sending, workspaceId, sessionToken])

  const name = config.agent_name || "Assistant"

  if (!isOpen) return (
    <div className="w-16 h-16 rounded-2xl bg-[#050505] flex items-center justify-center text-white shadow-lg">
      <MessageSquare className="w-7 h-7" />
    </div>
  )

  return (
    <div className="w-[400px] h-[620px] bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans">
      <div className="p-8 border-b border-gray-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white font-bold font-outfit">
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 leading-none">{name}</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Active & Online</p>
        </div>
        <X className="w-5 h-5 text-gray-300" />
      </div>

      {view === "form" ? (
        <div className="p-8 space-y-6">
           <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Let&apos;s get some basic info</h2>
              <p className="text-sm text-gray-400">This will help us know who you are</p>
           </div>
           <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-600">Full Name</label>
                 <input disabled placeholder="John Doe" className="w-full h-11 border border-gray-100 bg-gray-50 rounded-lg px-4 text-sm" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-600">Email Address</label>
                 <input disabled placeholder="john@example.com" className="w-full h-11 border border-gray-100 bg-gray-50 rounded-lg px-4 text-sm" />
              </div>
              <button className="w-full h-11 bg-black text-white rounded-lg font-bold text-sm mt-4">Start Chat</button>
           </div>
        </div>
      ) : (
        <>
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed", m.role === 'user' ? "ml-auto bg-black text-white rounded-br-md" : "mr-auto bg-gray-100 text-gray-800 rounded-bl-md")}>
                {m.text}
              </div>
            ))}
            {sending && <div className="mr-auto bg-gray-100 text-gray-400 rounded-2xl px-4 py-2 text-xs italic">Thinking...</div>}
          </div>
          <div className="p-6 border-t border-gray-100 flex items-center gap-3">
             <input disabled placeholder="Type a message..." className="flex-1 text-sm outline-none bg-transparent" />
             <Send className="w-5 h-5 text-black opacity-30" />
          </div>
        </>
      )}
      <div className="p-4 text-center border-t border-gray-50 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
         Powered by <span className="text-gray-900">FlowCore</span>
      </div>
    </div>
  )
}
