"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Loader2, Send, X, MessageSquare, Bot, User, Sparkles } from "lucide-react"

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
  const [sessionToken] = useState(() =>
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
    if (bodyRef.current) {
       bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
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
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_token: sessionToken,
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
  }, [input, sending, workspaceId, sessionToken])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const color = config?.accent_color || accentColor
  const name = config?.agent_name || "FlowCore Assistant"

  return (
    <div className="relative w-[360px] font-sans">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 group relative overflow-hidden"
          style={{ background: "#050505" }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#c65f39]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="w-6 h-6 text-white relative z-10" />
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-[28px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col bg-white" 
          style={{ height: 580, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-50 flex items-center gap-3 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Sparkles className="w-16 h-16 text-[#c65f39]" />
            </div>
            
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100" style={{ background: "#050505" }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold tracking-tight text-gray-900 leading-none truncate font-outfit">{name}</h3>
              <div className="flex items-center gap-1 mt-1.5">
                 <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active & Online</span>
              </div>
            </div>

            <button 
              onClick={() => setOpen(false)} 
              className="w-7 h-7 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-gray-100",
                  m.role === "user" ? "bg-white" : "bg-[#050505]"
                )}>
                  {m.role === "user" ? <User className="w-2.5 h-2.5 text-gray-400" /> : <Bot className="w-2.5 h-2.5 text-white" />}
                </div>
                
                <div
                  className={cn(
                    "max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-[#050505] text-white rounded-tr-none"
                      : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-lg bg-[#050505] flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-[12px] flex gap-2 items-center italic">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-0.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-0.5 h-0.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-0.5 h-0.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-gray-50 flex flex-col gap-3">
            <div className="relative group">
              <textarea
                ref={inpRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message assistant..."
                rows={1}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl pl-4 pr-12 py-3 text-[13px] outline-none resize-none min-h-[48px] max-h-24 transition-all focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 placeholder:text-gray-400 font-medium"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-20 active:scale-90 shadow-md shadow-[#c65f39]/20"
                style={{ background: "#c65f39" }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-1.5">
               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Powered by</span>
               <span className="text-[8px] font-black text-gray-900 uppercase tracking-widest opacity-80">FlowCore</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
