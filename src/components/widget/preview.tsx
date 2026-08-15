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

      const data = await res.json()
      setMsgs((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply }])
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
      <div className="w-[360px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold font-outfit overflow-hidden" style={{ background: accent }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 leading-none">{name}</h3>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Active & Online</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
           <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">Let&apos;s get some basic info</h2>
              <p className="text-xs text-gray-400">This will help us know who you are</p>
           </div>
           <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-600">Full Name</label>
                 <input disabled placeholder="John Doe" className="w-full h-11 border border-gray-100 bg-gray-50 rounded-lg px-4 text-sm" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-600">Email Address</label>
                 <input disabled placeholder="john@example.com" className="w-full h-11 border border-gray-100 bg-gray-50 rounded-lg px-4 text-sm" />
              </div>
              <button className="w-full h-11 text-white rounded-lg font-bold text-sm mt-4" style={{ background: accent }}>Start Chat</button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[360px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-[12px] flex items-center justify-center text-white font-bold font-outfit overflow-hidden" style={{ background: accent }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-none">{name}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Active & Online</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Chat
          messages={msgs}
          input={input}
          handleInputChange={(e) => setInput(e.target.value)}
          handleSubmit={handleSubmit}
          isGenerating={sending}
          className="h-full"
        />
      </div>
      <div className="p-2 text-center border-t border-gray-50 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
         Powered by <span className="text-gray-900">Flowcore</span>
      </div>
    </div>
  )
}
