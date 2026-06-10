"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, MessageSquare, Bot, User, 
  ChevronRight, Mail, Phone, ExternalLink, 
  Pencil, Send, Paperclip
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PreviewConfig {
  header_text: string
  agent_name: string
  greeting: string
  post_form_message: string
  accent_color: string
  launcher_color: string
  launcher_icon: string
  logo_url: string | null
  enable_whatsapp: boolean
  allow_anonymous: boolean
  default_country: string
}

interface PreviewProps {
  workspaceId: string
  view: "start" | "form" | "chat"
  isOpen: boolean
  config: PreviewConfig
}

export default function WidgetPreview({ workspaceId, view, isOpen, config }: PreviewProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  
  // Fake chat data
  const messages = [
    { role: "ai", text: config.post_form_message || "Hi there! I've received your details. How can I assist you today?", time: "12:30 PM" },
    { role: "user", text: "What's the weather in San Francisco?", time: "12:30 PM" },
    { role: "ai", text: "The weather is sunny and 60 degrees. Do you want to book our services?", time: "12:30 PM" },
    { role: "user", text: "Yes, I'd like to book it now.", time: "12:30 PM" }
  ]

  useEffect(() => {
    if (bodyRef.current && view === "chat") {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [view])

  const launcherColor = config.launcher_color || config.accent_color || "#000000"

  return (
    <div className="relative font-sans select-none pointer-events-none sm:pointer-events-auto">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="fab-container"
            className="flex justify-end pt-[544px] w-[380px]" // Align FAB to where it would be in the panel
          >
            <motion.button
              key="fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-xl border-none outline-none text-white"
              style={{ backgroundColor: launcherColor }}
            >
               <MessageSquare className="w-6 h-6 fill-current" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[380px] h-[600px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden relative"
          >
            {/* VIEW: START */}
            {view === "start" && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 flex justify-end">
                   <X className="w-5 h-5 text-gray-300 cursor-pointer hover:text-gray-500" />
                </div>
                
                <div className="px-10 py-12 space-y-8 flex-1">
                   <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                   </div>
                   
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{config.header_text || "FLOWCORE"}</p>
                      <h1 className="text-4xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                         {config.greeting || "Hi there,\nhow can we help?"}
                      </h1>
                   </div>

                   <div className="pt-8">
                      <div className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white hover:border-gray-200 transition-all shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                               <Mail className="w-5 h-5" />
                            </div>
                            <span className="text-base font-bold text-gray-800 tracking-tight">Send us a message</span>
                         </div>
                         <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </div>
                   </div>
                </div>

                <div className="p-6 text-center">
                   <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                      Powered by <span className="text-gray-800 font-black">FlowCore</span>
                   </p>
                </div>
              </div>
            )}

            {/* VIEW: FORM */}
            {view === "form" && (
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-6 flex items-center justify-between">
                   <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer">
                      <ChevronLeft className="w-5 h-5" />
                   </div>
                   <X className="w-5 h-5 text-gray-200" />
                </div>

                <div className="px-10 py-4 space-y-10 flex-1 overflow-y-auto scrollbar-none">
                   <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Let&apos;s get some basic info</h2>
                      <p className="text-sm text-gray-400 font-medium">This will help us know who you are</p>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full name</label>
                         <div className="h-14 w-full bg-white border border-gray-200 rounded-xl flex items-center px-4">
                            <input disabled placeholder="John Doe" className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-gray-300" />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone number</label>
                         <div className="flex gap-2">
                            <div className="h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 shrink-0">
                               <span className="text-xs font-bold text-gray-500">+{config.default_country === 'IN' ? '91' : '1'}</span>
                            </div>
                            <div className="h-14 flex-1 bg-white border border-gray-200 rounded-xl flex items-center px-4">
                               <input disabled placeholder="+1 (555) 123-4567" className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-gray-300" />
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="w-5 h-5 rounded border border-gray-300 bg-white" />
                         <span className="text-xs font-semibold text-gray-500">I prefer to message via WhatsApp</span>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email address</label>
                         <div className="h-14 w-full bg-white border border-gray-200 rounded-xl flex items-center px-4">
                            <input disabled placeholder="john@doe.com" className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-gray-300" />
                         </div>
                      </div>

                      <button className="w-full h-14 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 transition-all mt-4">
                        Submit
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* VIEW: CHAT */}
            {view === "chat" && (
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-white z-10">
                   <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
                      <Bot className="w-6 h-6" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{config.agent_name || "Assistant"}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active & Online</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-gray-300">
                      <Pencil className="w-4 h-4 cursor-pointer hover:text-gray-500" />
                      <X className="w-5 h-5 cursor-pointer hover:text-gray-500" />
                   </div>
                </div>

                <div ref={bodyRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-[#fafafa]/30">
                   {messages.map((m, i) => (
                     <div key={i} className="space-y-1">
                        <div className={cn(
                          "flex gap-2.5 items-end",
                          m.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}>
                           {m.role === "ai" && (
                             <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center shrink-0 mb-1">
                               <Bot className="w-3.5 h-3.5 text-white" />
                             </div>
                           )}
                           <div className={cn(
                             "max-w-[85%] px-4 py-3 text-[13px] leading-relaxed font-medium",
                             m.role === "user" 
                               ? "bg-black text-white rounded-2xl rounded-br-none shadow-md" 
                               : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none shadow-sm"
                           )}>
                              {m.text}
                           </div>
                        </div>
                        <div className={cn("flex px-9", m.role === "user" ? "justify-end" : "justify-start")}>
                           <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{m.time}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-6 bg-white border-t border-gray-50">
                   <div className="flex items-center gap-4">
                      <input disabled placeholder="Type a message..." className="flex-1 text-[13px] font-medium outline-none bg-transparent" />
                      <div className="flex items-center gap-3 text-gray-300">
                         <Paperclip className="w-5 h-5 cursor-pointer hover:text-gray-500" />
                         <div className="w-px h-5 bg-gray-100" />
                         <Send className="w-5 h-5 text-[#c65f39] cursor-pointer hover:scale-110 transition-transform" />
                      </div>
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

function ChevronLeft({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
}
