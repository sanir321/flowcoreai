"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X } from "lucide-react"
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

const LAUNCHER_ICON_SVGS: Record<string, string> = {
  chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`,
  message: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  support: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/></svg>`,
  bot: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
  comment: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  whatsapp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.5a7 7 0 0 1-9.9 9.9l-2.1.7.7-2.1a7 7 0 0 1 9.9-9.9"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-8.5-4.9"/><path d="M8 11c.3-1 1-1.5 2-1.5s1.7.5 2 1.5c.3 1 .5 2 1 2.5s1.5 1 2.5 1"/><circle cx="9" cy="10" r=".5" fill="currentColor"/><circle cx="15" cy="10" r=".5" fill="currentColor"/></svg>`
}

export default function WidgetPreview({ workspaceId, view = "chat", isOpen = true, config: localConfig }: PreviewProps) {
  const [msgs, setMsgs] = useState<{ text: string; role: string }[]>([])
  const [sending] = useState(false)
  const [dbConfig, setDbConfig] = useState<WidgetConfig | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/widget/config?id=" + workspaceId)
      .then((r) => r.json())
      .then((d) => setDbConfig(d))
      .catch(() => {})
  }, [workspaceId])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = { ...dbConfig, ...localConfig } as any
  const accent = config.accent_color || "#050505"

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

  const name = config.agent_name || "Assistant"
  const logoUrl = config.logo_url || null
  const iconKey = config.launcher_icon || "chat"
  const launcherSvg = (LAUNCHER_ICON_SVGS[iconKey] || LAUNCHER_ICON_SVGS.chat) as string

  if (!isOpen) return (
    <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white shadow-lg" style={{ background: accent }}
      dangerouslySetInnerHTML={{ __html: launcherSvg }}
    />
  )


  return (
    <div className="w-[360px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold font-outfit overflow-hidden" style={{ background: accent }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 leading-none">{name}</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Active & Online</p>
        </div>
        <X className="w-5 h-5 text-gray-300" />
      </div>

      {view === "form" ? (
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
      ) : (
        <>
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed", m.role === 'user' ? "ml-auto text-white rounded-br-md" : "mr-auto bg-gray-100 text-gray-800 rounded-bl-md")} style={m.role === 'user' ? { background: accent } : undefined}>
                {m.text}
              </div>
            ))}
            {sending && <div className="mr-auto bg-gray-100 text-gray-400 rounded-2xl px-4 py-2 text-[11px] italic">Thinking...</div>}
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center gap-2">
             <input disabled placeholder="Type a message..." className="flex-1 text-[13px] outline-none bg-transparent" />
             <Send className="w-5 h-5 opacity-30" style={{ color: accent }} />
          </div>
        </>
      )}
      <div className="p-3 text-center border-t border-gray-50 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
         Powered by <span className="text-gray-900">FlowCore</span>
      </div>
    </div>
  )
}
