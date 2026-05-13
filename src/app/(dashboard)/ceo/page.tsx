"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, TrendingUp, Zap, Loader2, BarChart3, Target, ChevronDown, ChevronUp, Brain, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"

interface Message {
  role: 'user' | 'assistant'
  content: string
  thought?: string
  id: string
  timestamp: string
}

const ReasoningAccordion = ({ thought }: { thought: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="mb-3 w-full max-w-2xl">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
      >
        <div className="h-5 w-5 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:border-gray-300">
           {isOpen ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
        <div className="flex items-center gap-1.5">
           <Brain size={12} className="text-[#c65f39]" />
           <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">View Reasoning</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {thought}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const dotVariants = {
  animate: (i: number) => ({
    y: [0, -4, 0],
    scale: [1, 1.2, 1],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      delay: i * 0.2,
      ease: "easeInOut"
    }
  })
}

const ThinkingIndicator = () => {
  const [step, setStep] = useState(0)
  const steps = [
    "Analyzing workspace data",
    "Reviewing agent performance",
    "Identifying patterns",
    "Formulating insights"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-3 px-1">
      <motion.div
        animate={{ borderColor: ["rgba(198,95,57,0.1)", "rgba(198,95,57,0.25)", "rgba(198,95,57,0.1)"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              custom={i}
              variants={dotVariants}
              animate="animate"
              className="h-2 w-2 rounded-full bg-[#c65f39]"
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 8, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="text-xs font-semibold text-gray-500"
          >
            {steps[step]}...
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <div className="ml-4 h-1 w-40 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/4 bg-gradient-to-r from-transparent via-[#c65f39]/60 to-transparent rounded-full"
        />
      </div>
    </div>
  )
}

const StructuredContent = ({ content }: { content: string }) => {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false

  lines.forEach((line, i) => {
    if (!line.trim()) {
      if (inList) { inList = false; elements.push(<div key={`spacer-${i}`} className="h-2" />) }
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      if (inList) { inList = false }
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h3>
      )
      return
    }
    if (line.startsWith('## ')) {
      if (inList) { inList = false }
      elements.push(
        <h2 key={i} className="text-lg font-black text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>
      )
      return
    }
    if (line.startsWith('# ')) {
      if (inList) { inList = false }
      elements.push(
        <h1 key={i} className="text-xl font-black text-gray-900 mt-8 mb-4">{line.slice(2)}</h1>
      )
      return
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { inList = true; elements.push(<ul key={`ul-${i}`} className="space-y-1.5 my-2" />) }
      elements.push(
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 ml-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c65f39] mt-2 shrink-0" />
          <span>{renderBold(line.slice(2))}</span>
        </li>
      )
      return
    }
    if (inList) { inList = false; elements.push(<div key={`endlist-${i}`} className="h-2" />) }

    // Numbered items
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-3 text-sm text-gray-700 my-1.5">
          <span className="h-6 w-6 rounded-full bg-[#c65f39]/10 text-[#c65f39] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{numberedMatch[1]}</span>
          <span className="pt-0.5">{renderBold(numberedMatch[2])}</span>
        </div>
      )
      return
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{renderBold(line)}</p>
    )
  })

  return <div className="space-y-1">{elements}</div>
}

const renderBold = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function CEOAnalystPage() {
  const { workspaceId } = useWorkspace()
  const [prompt, setPrompt] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt
    if (!textToSend.trim() || isSending) return

    const userMessage = textToSend.trim()
    const msgId = crypto.randomUUID()
    setPrompt("")
    setIsSending(true)
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      id: msgId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])

    try {
      const res = await fetch("/api/insights/ceo-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          agent_type: "business_analyst",
          reasoning: "deep"
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.reply || "Failed to get response from CEO Analyst");
      }
      
      const data = await res.json()
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || "I'm analyzing your data, but couldn't generate a final response. Please try again.",
        thought: data.thought,
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (error: any) {
      toast.error(error.message)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble accessing your workspace data right now. Please check your integrations and try again.",
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsSending(false)
    }
  }

  const PRESETS = [
    { label: "Performance Audit", icon: BarChart3, query: "Give me a full performance audit of my AI agents for the last 7 days." },
    { label: "Lead Growth", icon: Target, query: "Analyze our lead capture growth. Are we improving?" },
    { label: "Scale Strategy", icon: Zap, query: "Based on our current data, what is the #1 thing I should do to scale?" }
  ]

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      <AssistantsSidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-gray-50">
        {/* Header */}
        <div className="h-20 px-4 md:px-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg">
               <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">CEO Analyst</h2>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Strategy Session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Thread */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto py-12 px-4 md:px-6">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 space-y-12"
                >
                  <div className="text-center space-y-4">
                     <div className="h-16 w-16 rounded-3xl bg-black flex items-center justify-center text-white mx-auto shadow-xl mb-6">
                       <Sparkles size={28} />
                     </div>
                     <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Strategy Intelligence</h1>
                     <p className="text-gray-400 text-sm font-medium max-w-md mx-auto">Ask anything about your performance data, leads, or scaling strategy.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {PRESETS.map((p, i) => (
                       <button 
                         key={i}
                         onClick={() => handleSend(p.query)}
                         className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left flex flex-col gap-4 group active:scale-[0.98]"
                       >
                         <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                           <p.icon size={16} />
                         </div>
                         <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 leading-tight">{p.label}</span>
                       </button>
                     ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-8 pb-32">
                  {messages.map((m) => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col gap-2",
                        m.role === 'user' ? "items-end ml-8 md:ml-16" : "items-start mr-8 md:mr-16"
                      )}
                    >
                      {m.role === 'assistant' && m.thought && (
                        <ReasoningAccordion thought={m.thought} />
                      )}
                      <div className={cn(
                        "px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-2xl",
                        m.role === 'user' 
                          ? "bg-black text-white rounded-tr-sm" 
                          : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                      )}>
                        {m.role === 'user' ? (
                          <p className="text-sm">{m.content}</p>
                        ) : (
                          <StructuredContent content={m.content} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {m.role === 'user' ? 'You' : 'Analyst'}
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{m.timestamp}</span>
                      </div>
                    </motion.div>
                  ))}
                  {isSending && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-start gap-3"
                    >
                      <ThinkingIndicator />
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center gap-3 bg-white border border-gray-200 p-1.5 pl-5 rounded-2xl transition-all focus-within:border-gray-300 focus-within:shadow-lg focus-within:ring-4 focus-within:ring-gray-100">
              <input 
                type="text"
                placeholder="Ask about your business performance..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 placeholder:text-gray-300 outline-none h-12"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button 
                onClick={() => handleSend()}
                disabled={!prompt.trim() || isSending}
                className={cn(
                  "h-11 w-11 rounded-xl transition-all active:scale-95 flex items-center justify-center",
                  prompt.trim() && !isSending 
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md" 
                    : "bg-gray-100 text-gray-300"
                )}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

