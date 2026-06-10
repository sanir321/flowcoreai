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

export default function WidgetPreview({ workspaceId, view = "start", isOpen = true, config: localConfig }: PreviewProps) {
  const [msgs, setMsgs] = useState<{ text: string; role: string; timestamp?: string }[]>([])
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

  // Merge database config with unsaved local changes from dashboard
  const config = { ...dbConfig, ...localConfig } as any

  useEffect(() => {
    if (view === "chat" && msgs.length === 0) {
      setMsgs([{ 
        text: config.post_form_message || "Hi! I've received your details. How can I help you today?", 
        role: "bot",
        timestamp: "12:30 PM"
      }])
    }
  }, [view, config.post_form_message, msgs.length])

  useEffect(() => {
    if (bodyRef.current) {
       bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [msgs])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setSending(true)
    setMsgs((prev) => [...prev, { text, role: "user", timestamp: "12:30 PM" }])

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
        setMsgs((prev) => [...prev, { text: data.reply, role: "bot", timestamp: "12:30 PM" }])
      }
    } catch {
      setMsgs((prev) => [...prev, { text: "Connection error. Try again.", role: "bot" }])
    }
    setSending(false)
  }, [input, sending, workspaceId, sessionToken])

  const color = config.accent_color || "#c65f39"
  const name = config.agent_name || "Assistant"
  const header = config.header_text || "FlowCore"

  return (
    <div className="relative w-full max-w-[380px] font-sans">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-14 h-14 rounded-[20px] flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 group relative overflow-hidden ml-auto"
            style={{ background: "#050505" }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#c65f39]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <MessageSquare className="w-7 h-7 text-white relative z-10" />
          </motion.button>
        ) : (
          <motion.div 
            key="panel"
            initial={{ opacity: 0, y: 30, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="rounded-[28px] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col bg-white" 
            style={{ height: 600 }}
          >
            {/* VIEW: START */}
            {view === "start" && (
              <div className="flex-1 flex flex-col">
                <div className="p-8 pb-0 flex justify-end shrink-0">
                   <X className="w-5 h-5 text-gray-200" />
                </div>
                <div className="p-10 pt-4 space-y-6 flex-1 overflow-y-auto scrollbar-none">
                   <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg border border-gray-800">
                      <MessageSquare className="w-8 h-8 text-white" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{header}</p>
                      <h1 className="text-[34px] font-bold tracking-tight text-gray-900 leading-[1.1] font-outfit">
                         {config.greeting || "Hi there, how can we help?"}
                      </h1>
                   </div>
                   
                   <div className="pt-6 space-y-4">
                      <button className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] flex items-center justify-between group hover:bg-white hover:border-[#c65f39] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                         <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#c65f39] transition-colors">
                               <Mail className="w-4.5 h-4.5" />
                            </div>
                            <span className="text-sm font-bold text-gray-900 tracking-tight">Send us a message</span>
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#c65f39] transition-colors" />
                      </button>

                      {config.enable_whatsapp && (
                        <button className="w-full p-5 bg-[#25D366]/5 border border-[#25D366]/10 rounded-[20px] flex items-center justify-between group hover:bg-[#25D366]/10 hover:border-[#25D366] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                           <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#25D366]">
                                 <MessageSquare className="w-4.5 h-4.5 fill-current" />
                              </div>
                              <span className="text-sm font-bold text-gray-900 tracking-tight">Message on WhatsApp</span>
                           </div>
                           <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#25D366] transition-colors" />
                        </button>
                      )}
                   </div>
                </div>
                <div className="p-6 text-center border-t border-gray-50 shrink-0">
                   <div className="flex items-center justify-center gap-2">
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-none">Powered by</span>
                      <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none opacity-80">FlowCore</span>
                   </div>
                </div>
              </div>
            )}

            {/* VIEW: FORM */}
            {view === "form" && (
              <div className="flex-1 flex flex-col">
                <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                   <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer">
                      <ChevronLeft className="w-4.5 h-4.5" />
                   </div>
                   <X className="w-5 h-5 text-gray-200" />
                </div>
                <div className="p-10 pt-4 space-y-8 flex-1 overflow-y-auto scrollbar-none">
                   <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-outfit leading-tight">Let&apos;s get some basic info</h2>
                      <p className="text-sm text-gray-400 font-medium">This will help us know who you are</p>
                   </div>

                   <div className="space-y-5">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Full Name</label>
                         <input disabled placeholder="John Doe" className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium outline-none" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Phone Number</label>
                         <div className="flex gap-2">
                            <div className="h-12 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-1.5 shrink-0">
                               <span className="text-xs font-bold text-gray-500">+{config.default_country === 'IN' ? '91' : '1'}</span>
                            </div>
                            <input disabled placeholder="98765 43210" className="flex-1 h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium outline-none" />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Email Address</label>
                         <input disabled placeholder="john@doe.com" className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium outline-none" />
                      </div>
                      
                      <div className="flex items-center gap-3 pt-2">
                         <div className="w-5 h-5 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#c65f39]" />
                         </div>
                         <span className="text-[11px] font-semibold text-gray-500 tracking-tight">I prefer to message via WhatsApp</span>
                      </div>

                      <button className="w-full h-14 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 active:scale-95 transition-all mt-4">Submit</button>
                   </div>
                </div>
              </div>
            )}

            {/* VIEW: CHAT */}
            {view === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-white shrink-0">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 bg-black">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold tracking-tight text-gray-900 leading-none truncate font-outfit">{name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active & Online</span>
                    </div>
                  </div>
                  <X className="w-5 h-5 text-gray-200" />
                </div>

                <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-white">
                  {msgs.map((m, i) => (
                    <div key={i} className="space-y-1">
                       <div className={cn("flex gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                         <div className={cn("w-5.5 h-5.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-gray-100", m.role === "user" ? "bg-white" : "bg-black")}>
                           {m.role === "user" ? <User className="w-3.5 h-3.5 text-gray-400" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm", m.role === "user" ? "bg-black text-white rounded-tr-none" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none")}>
                           {m.text}
                         </div>
                       </div>
                       {m.timestamp && (
                         <div className={cn("flex px-8", m.role === "user" ? "justify-end" : "justify-start")}>
                            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{m.timestamp}</span>
                         </div>
                       )}
                    </div>
                  ))}
                  {sending && (
                    <div className="flex gap-2.5 animate-pulse">
                      <div className="w-5.5 h-5.5 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-[12px] italic">
                         Thinking...
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t border-gray-50 shrink-0">
                  <div className="relative group">
                    <input
                      disabled
                      placeholder="Type a message..."
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-5 pr-14 h-14 text-[13px] outline-none transition-all focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 font-medium"
                    />
                    <button className="absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#c65f39] shadow-md shadow-[#c65f39]/20 opacity-40">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
