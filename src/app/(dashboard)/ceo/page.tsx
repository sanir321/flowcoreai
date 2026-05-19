"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, TrendingUp, Zap, Loader2, BarChart3, Target, ChevronDown, ChevronUp, Brain, MessageSquare, Users, AlertCircle } from "lucide-react"
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
    <div className="mb-2 w-full max-w-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all group"
      >
        <div className="h-4 w-4 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200">
          {isOpen ? <ChevronUp size={10} className="text-gray-400" /> : <ChevronDown size={10} className="text-gray-400" />}
        </div>
        <Brain size={11} className="text-[#c65f39]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Reasoning</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {thought}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-gray-200">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-[#c65f39]"
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={step}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.2 }}
          className="text-[11px] font-medium text-gray-500"
        >
          {steps[step]}...
        </motion.span>
      </AnimatePresence>
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

    if (line.startsWith('### ')) {
      if (inList) { inList = false }
      elements.push(<h3 key={i} className="text-sm font-bold text-gray-900 mt-4 mb-1.5">{line.slice(4)}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      if (inList) { inList = false }
      elements.push(<h2 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">{line.slice(3)}</h2>)
      return
    }
    if (line.startsWith('# ')) {
      if (inList) { inList = false }
      elements.push(<h1 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-2">{line.slice(2)}</h1>)
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { inList = true }
      elements.push(
        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 my-1">
          <span className="h-1 w-1 rounded-full bg-[#c65f39] mt-1.5 shrink-0" />
          <span>{renderBold(line.slice(2))}</span>
        </li>
      )
      return
    }
    if (inList) { inList = false; elements.push(<div key={`endlist-${i}`} className="h-1" />) }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-[13px] text-gray-700 my-1">
          <span className="h-5 w-5 rounded-full bg-[#c65f39]/10 text-[#c65f39] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{numberedMatch[1]}</span>
          <span className="pt-0.5">{renderBold(numberedMatch[2] ?? "")}</span>
        </div>
      )
      return
    }

    elements.push(<p key={i} className="text-[13px] text-gray-700 leading-relaxed mb-1.5">{renderBold(line)}</p>)
  })

  return <div className="space-y-0.5">{elements}</div>
}

const renderBold = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
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
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.reply || "Failed to get response")
      }

      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || "I couldn't generate a final response. Please try again.",
        thought: data.thought,
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (error: any) {
      toast.error(error.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble accessing your workspace data. Please check your integrations and try again.",
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
        <div className="h-12 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-black flex items-center justify-center text-white">
              <TrendingUp size={14} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight">CEO Analyst</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-gray-400">Online</span>
          </div>
        </div>

        {/* Chat */}
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto py-8 px-5">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-8 space-y-8"
                >
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center text-white mx-auto shadow-lg">
                      <TrendingUp size={22} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Strategy Intelligence</h1>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">Ask about performance, leads, or scaling strategy.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESETS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(p.query)}
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left flex flex-col gap-3 group active:scale-[0.98]"
                      >
                        <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                          <p.icon size={14} />
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 group-hover:text-gray-900 leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6 pb-24">
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col gap-1.5",
                        m.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      {m.role === 'assistant' && m.thought && (
                        <ReasoningAccordion thought={m.thought} />
                      )}
                      <div className={cn(
                        "px-4 py-2.5 rounded-xl text-[13px] leading-relaxed max-w-xl shadow-sm",
                        m.role === 'user'
                          ? "bg-black text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                      )}>
                        {m.role === 'user' ? (
                          <p className="text-[13px]">{m.content}</p>
                        ) : (
                          <StructuredContent content={m.content} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-medium text-gray-400">
                          {m.role === 'user' ? 'You' : 'Analyst'}
                        </span>
                        <span className="text-[10px] text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{m.timestamp}</span>
                      </div>
                    </motion.div>
                  ))}
                  {isSending && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-start"
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

        {/* Input */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition-all focus-within:border-gray-300 focus-within:shadow-sm">
              <input
                type="text"
                placeholder="Ask about your business..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none h-8"
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
                  "h-8 w-8 rounded-lg transition-all active:scale-95 flex items-center justify-center shrink-0",
                  prompt.trim() && !isSending
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-300"
                )}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
