"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Send, TrendingUp, Zap, Loader2, BarChart3, Target, ChevronDown, ChevronUp, Brain, MessageSquare, Users, AlertCircle, Code, Quote, Sparkles, Lightbulb, Clipboard, Check, Plus, X, FileText } from "lucide-react"
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
  displayContent?: string
  streaming?: boolean
}

const ReasoningAccordion = ({ thought }: { thought: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <div className="mb-2 w-full max-w-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
      >
        <div className={cn(
          "h-4 w-4 rounded-lg flex items-center justify-center transition-colors",
          isOpen ? "bg-[#c65f39]/10" : "bg-gray-50"
        )}>
          {isOpen ? <ChevronUp size={10} className="text-[#c65f39]" /> : <ChevronDown size={10} className="text-gray-400" />}
        </div>
        <Brain size={12} className="text-[#c65f39]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">Analysis</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="relative mt-1.5 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap shadow-sm">
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(thought); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="h-6 w-6 rounded-md bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all"
                >
                  {copied ? <Check size={10} className="text-emerald-500" /> : <Clipboard size={10} className="text-gray-400" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb size={11} className="text-amber-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Deep Analysis</span>
              </div>
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
    "Scanning workspace metrics",
    "Analyzing agent performance",
    "Cross-referencing trends",
    "Formulating insights"
  ]

  useEffect(() => {
    const interval = setInterval(() => setStep(prev => (prev + 1) % steps.length), 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
            className="h-1.5 w-1.5 rounded-full bg-[#c65f39]"
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={step}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          transition={{ duration: 0.15 }}
          className="text-[11px] font-medium text-gray-500"
        >
          {steps[step]}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >...</motion.span>
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-sm"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Clipboard size={11} className="text-gray-400" />}
    </button>
  )
}

const StructuredContent = ({ content }: { content: string }) => {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let inCodeBlock = false
  let codeContent = ''
  let codeLang = ''

  const flushCodeBlock = (key: string) => {
    if (!codeContent) return
    elements.push(
      <div key={key} className="relative group my-3">
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 text-gray-400 text-[10px] font-mono rounded-t-xl border-b border-gray-800">
          <span>{codeLang || 'code'}</span>
        </div>
        <pre className="p-4 bg-gray-900 text-gray-100 text-[12px] leading-relaxed font-mono overflow-x-auto rounded-b-xl">
          <code>{codeContent}</code>
        </pre>
        <CopyButton text={codeContent} />
      </div>
    )
    codeContent = ''
    codeLang = ''
  }

  lines.forEach((line, i) => {
    const key = `l-${i}`

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(key)
        inCodeBlock = false
        return
      }
      inCodeBlock = true
      codeLang = line.slice(3).trim()
      codeContent = ''
      return
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
      return
    }

    if (!line.trim()) {
      if (inList) { inList = false; elements.push(<div key={`sp-${i}`} className="h-2" />) }
      else { elements.push(<div key={`sp-${i}`} className="h-3" />) }
      return
    }

    if (line.startsWith('### ')) {
      if (inList) { inList = false }
      elements.push(<h3 key={key} className="text-sm font-bold text-gray-900 mt-5 mb-2 flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-[#c65f39]" />{line.slice(4)}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      if (inList) { inList = false }
      elements.push(<h2 key={key} className="text-base font-bold text-gray-900 mt-6 mb-3">{line.slice(3)}</h2>)
      return
    }
    if (line.startsWith('# ')) {
      if (inList) { inList = false }
      elements.push(<h1 key={key} className="text-lg font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>)
      return
    }

    if (line.startsWith('> ')) {
      if (inList) { inList = false }
      elements.push(
        <div key={key} className="flex gap-2 my-2 pl-3 border-l-2 border-[#c65f39]/30">
          <Quote size={12} className="text-[#c65f39]/50 mt-0.5 shrink-0" />
          <p className="text-[12px] text-gray-500 italic leading-relaxed">{renderInline(line.slice(2))}</p>
        </div>
      )
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { inList = true; elements.push(<ul key={`ul-${i}`} className="space-y-1.5 my-1" />) }
      elements.push(
        <li key={key} className="flex items-start gap-2.5 text-[13px] text-gray-700 pl-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c65f39]/60 mt-2 shrink-0" />
          <span className="flex-1">{renderInline(line.slice(2))}</span>
        </li>
      )
      return
    }
    if (inList) { inList = false; elements.push(<div key={`el-${i}`} className="h-1" />) }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={key} className="flex items-start gap-3 text-[13px] text-gray-700 my-1.5">
          <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-[#c65f39]/10 to-[#c65f39]/5 border border-[#c65f39]/20 text-[#c65f39] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{numberedMatch[1]}</div>
          <span className="flex-1 pt-0.5">{renderInline(numberedMatch[2] ?? "")}</span>
        </div>
      )
      return
    }

    elements.push(
      <p key={key} className="text-[13px] text-gray-700 leading-relaxed my-1">{renderInline(line)}</p>
    )
  })

  if (inCodeBlock) { flushCodeBlock('end-code') }

  return <div className="space-y-0.5">{elements}</div>
}

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|https?:\/\/\S+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[#c65f39] text-[11px] font-mono">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('http')) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#c65f39] underline underline-offset-2 decoration-[#c65f39]/30 hover:decoration-[#c65f39] transition-all">{part}</a>
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
      const fullReply = data.reply || "I couldn't generate a final response. Please try again."

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullReply,
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
    { label: "Full Audit", icon: BarChart3, query: "Give me a full performance audit of my AI agents for the last 7 days." },
    { label: "Lead Trends", icon: Target, query: "Analyze our lead capture growth. Are we improving?" },
    { label: "Scale Now", icon: Zap, query: "Based on our current data, what is the #1 thing I should do to scale?" },
    { label: "Pain Points", icon: AlertCircle, query: "What are the most common customer pain points this week?" }
  ]

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      <AssistantsSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-13 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white shadow-sm">
              <TrendingUp size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight">CEO Analyst</h2>
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Strategy Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
            </div>
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
                  className="py-12 space-y-10"
                >
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center text-white mx-auto shadow-xl shadow-black/10 relative">
                      <TrendingUp size={26} />
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="space-y-1.5">
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">CEO Intelligence</h1>
                      <p className="text-[13px] text-gray-400 max-w-sm mx-auto leading-relaxed">Real-time analysis of your AI workforce performance, lead pipeline, and growth opportunities.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {PRESETS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(p.query)}
                        className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm hover:-translate-y-0.5 transition-all text-left flex flex-col gap-3 group active:scale-[0.98]"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-300">
                          <p.icon size={15} />
                        </div>
                        <span className="text-[12px] font-semibold text-gray-600 group-hover:text-gray-900 leading-tight transition-colors">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6 pb-28">
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
                        "relative group max-w-xl",
                        m.role === 'user' ? "pr-0" : "pl-0"
                      )}>
                        <div className={cn(
                          "px-4 py-3 text-[13px] leading-relaxed shadow-sm",
                          m.role === 'user'
                            ? "bg-gray-900 text-white rounded-2xl rounded-tr-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
                        )}>
                          {m.role === 'user' ? (
                            <p className="text-[13px]">{m.content}</p>
                          ) : (
                            <StructuredContent content={m.content} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          "h-4 w-4 rounded-md flex items-center justify-center",
                          m.role === 'user' ? "bg-gray-100" : "bg-[#c65f39]/10"
                        )}>
                          {m.role === 'user'
                            ? <Users size={9} className="text-gray-400" />
                            : <Brain size={9} className="text-[#c65f39]" />
                          }
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          {m.role === 'user' ? 'You' : 'CEO Analyst'}
                        </span>
                        <span className="text-gray-200">·</span>
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
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl transition-all focus-within:border-gray-300 focus-within:shadow-sm focus-within:bg-gray-50/50">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about your business..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none h-9"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!prompt.trim() || isSending}
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0",
                  prompt.trim() && !isSending
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                    : "bg-gray-50 text-gray-300"
                )}
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </div>
            <p className="text-[9px] text-gray-300 text-center mt-2 font-medium">
              AI-powered analysis of your workspace performance data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
