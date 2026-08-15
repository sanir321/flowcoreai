"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, TrendingUp, Zap, Loader2, BarChart3, Target, ChevronDown, ChevronUp, Brain, Users, AlertCircle, Lightbulb, Clipboard, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input"
import { ThinkingBar } from "@/components/ui/thinking-bar"
import { FeedbackBar } from "@/components/ui/feedback-bar"
import { Markdown } from "@/components/ui/markdown"

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
          isOpen ? "bg-[#f9510b]/10" : "bg-gray-50"
        )}>
          {isOpen ? <ChevronUp size={10} className="text-[#f9510b]" /> : <ChevronDown size={10} className="text-gray-400" />}
        </div>
        <Brain size={12} className="text-[#f9510b]" />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            className="h-1.5 w-1.5 rounded-full bg-[#f9510b]"
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



export default function CEOAnalystPage() {
  const [prompt, setPrompt] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="flex min-h-0 flex-1 bg-white font-sans">
      <AssistantsSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm" style={{ height: 52 }}>
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
        <ScrollArea className="flex min-h-0 flex-1">
          <div className="max-w-2xl mx-auto py-6 px-5">
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
                <div className="space-y-6 pb-16">
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
                            <Markdown className="text-[13px] leading-relaxed text-gray-800 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:space-y-1 [&_ul]:my-2 [&_ol]:space-y-1 [&_ol]:my-2 [&_li]:text-[13px] [&_li]:text-gray-700 [&_p]:text-[13px] [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-[#f9510b]/30 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-gray-500 [&_blockquote]:italic [&_code]:bg-gray-100 [&_code]:text-[#f9510b] [&_code]:text-[11px] [&_code]:font-mono [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded-md">
                              {m.content}
                            </Markdown>
                          )}
                        </div>
                      </div>
                      {m.role === 'assistant' && !ratedIds.has(m.id) && (
                        <div className="mt-1">
                          <FeedbackBar
                            title="Was this helpful?"
                            onHelpful={() => { setRatedIds(prev => new Set(prev).add(m.id)); toast.success("Thanks for your feedback!") }}
                            onNotHelpful={() => { setRatedIds(prev => new Set(prev).add(m.id)); toast.success("Thanks for your feedback!") }}
                            onClose={() => setRatedIds(prev => new Set(prev).add(m.id))}
                            className="text-[11px]"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          "h-4 w-4 rounded-md flex items-center justify-center",
                          m.role === 'user' ? "bg-gray-100" : "bg-[#f9510b]/10"
                        )}>
                          {m.role === 'user'
                            ? <Users size={9} className="text-gray-400" />
                            : <Brain size={9} className="text-[#f9510b]" />
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
            <PromptInput
              value={prompt}
              onValueChange={setPrompt}
              onSubmit={() => handleSend()}
              isLoading={isSending}
              maxHeight={180}
              className="bg-white border-gray-200 rounded-2xl shadow-none p-1"
            >
              <PromptInputTextarea
                ref={inputRef as any}
                placeholder="Ask about your business..."
                className="min-h-[36px] h-9 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 resize-none"
                disabled={isSending}
              />
              <PromptInputActions>
                <PromptInputAction tooltip="Send">
                  <Button
                    onClick={() => handleSend()}
                    disabled={!prompt.trim() || isSending}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0",
                      prompt.trim() && !isSending
                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                        : "bg-gray-50 text-gray-300"
                    )}
                  >
                    {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>
            <p className="text-[9px] text-gray-300 text-center mt-2 font-medium">
              AI-powered analysis of your workspace performance data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
