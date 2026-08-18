"use client"

import React, { useState, useEffect } from "react"
import { MessageCircle, Mail, Headphones, Bot, MessageSquare } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { Chat } from "@/components/ui/chat"
import type { Message } from "@/components/ui/chat-message"

export interface WidgetConfig {
  header_text: string
  agent_name: string
  greeting: string
  post_form_message: string
  accent_color: string
  theme: string
  logo_url: string | null
  launcher_icon: string
  allow_anonymous: boolean
  auto_fill_params: boolean
  email_notifications: boolean
}

interface PreviewProps {
  workspaceId: string
  view: "start" | "form" | "chat"
  isOpen: boolean
  config: Partial<WidgetConfig>
}

const LAUNCHER_ICONS_PREVIEW: Record<string, React.ElementType> = {
  chat: MessageCircle,
  message: Mail,
  support: Headphones,
  bot: Bot,
  comment: MessageSquare,
  whatsapp: FaWhatsapp
}

export default function WidgetPreview({ workspaceId, view = "chat", isOpen = true, config: localConfig }: PreviewProps) {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [dbConfig, setDbConfig] = useState<WidgetConfig | null>(null)
  const [sending, setSending] = useState(false)
  const sessionTokenRef = React.useRef<string>(crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }))

  useEffect(() => {
    fetch("/api/widget/config?id=" + workspaceId)
      .then((r) => {
        if (!r.ok) throw new Error("Config not found or domain restricted")
        return r.json()
      })
      .then((d) => setDbConfig(d))
      .catch((err) => {
        console.warn("[WIDGET_PREVIEW] Using local fallback:", err.message)
      })
  }, [workspaceId])

  const config = { ...dbConfig, ...localConfig }
  const accent = config.accent_color || "#050505"

  useEffect(() => {
    if (view === "chat" && msgs.length === 0) {
      setMsgs([{ id: "1", role: "assistant", content: config.greeting || "Hi! How can I help you?" }])
    }
  }, [view, config.greeting, msgs.length])

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMsgs((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/widget/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-widget-token": sessionTokenRef.current,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_token: sessionTokenRef.current,
          message: text,
          customer_name: "Preview User",
          customer_email: "preview@example.com",
        }),
      })

      if (res.status === 403) {
        setMsgs((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "This chat is not available on this website." }])
        return
      }

      if (!res.ok) {
        throw new Error("Widget message failed")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader available")
      const decoder = new TextDecoder("utf-8")
      
      const msgId = (Date.now() + 1).toString()
      setMsgs((prev) => [...prev, { id: msgId, role: "assistant", content: "" }])

      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6))
              const content = data.choices?.[0]?.delta?.content
              if (content) {
                setMsgs((prev) => prev.map(m => 
                  m.id === msgId ? { ...m, content: m.content + content } : m
                ))
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch {
      setMsgs((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Technical hiccup. Please try again." }])
    } finally {
      setSending(false)
    }
  }

  const name = config.agent_name || "Assistant"
  const logoUrl = config.logo_url || null
  const iconKey = config.launcher_icon || "chat"
  const LauncherIcon = LAUNCHER_ICONS_PREVIEW[iconKey] || LAUNCHER_ICONS_PREVIEW.chat as React.ElementType

  if (!isOpen) return (
    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white shadow-lg" style={{ background: accent }}>
      {React.createElement(LauncherIcon, { className: "w-6 h-6" })}
    </div>
  )

  if (view === "form") {
    return (
      <div 
        className="w-[360px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans relative"
        style={{ '--widget-accent': accent } as React.CSSProperties}
      >
        <div className="absolute top-0 left-0 right-0 h-32 opacity-10" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }} />
        
        <div className="p-6 flex items-center gap-4 relative z-10" style={{ background: accent }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 bg-white font-bold text-xl font-outfit overflow-hidden shadow-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-white leading-tight tracking-tight">{name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <p className="text-[11px] text-white/90 font-medium tracking-wide">We reply instantly</p>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gray-50/50 relative z-10 p-6 space-y-5">
           <div className="space-y-1">
              <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Let&apos;s get some basic info</h2>
              <p className="text-[13px] text-gray-500 font-medium">This will help us know who you are</p>
           </div>
           <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-700">Full Name</label>
                 <input disabled placeholder="John Doe" className="w-full h-[46px] border border-gray-200 bg-white rounded-xl px-4 text-[14px] shadow-sm outline-none" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-700">Email Address</label>
                 <input disabled placeholder="john@example.com" className="w-full h-[46px] border border-gray-200 bg-white rounded-xl px-4 text-[14px] shadow-sm outline-none" />
              </div>
              <button className="w-full h-[46px] text-white rounded-xl font-bold text-[14px] mt-4 shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]" style={{ background: accent }}>Start Chat</button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="w-[360px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans relative"
      style={{ '--widget-accent': accent } as React.CSSProperties}
    >
      <div className="p-5 flex items-center gap-4 relative z-10" style={{ background: accent }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-gray-900 bg-white font-bold font-outfit overflow-hidden shadow-sm">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-white leading-none tracking-tight">{name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <p className="text-[11px] text-white/90 font-medium tracking-wide">We reply instantly</p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-gray-50/50 flex flex-col relative z-10">
        <Chat
          messages={msgs}
          input={input}
          handleInputChange={(e) => setInput(e.target.value)}
          handleSubmit={handleSubmit}
          isGenerating={sending}
          className="h-full px-4 pt-4 pb-2"
        />
      </div>
      <div className="py-2.5 text-center bg-white border-t border-gray-50 text-[10px] font-bold text-gray-300 uppercase tracking-widest z-10">
         Powered by <span className="text-gray-900">Flowcore</span>
      </div>
    </div>
  )
}
