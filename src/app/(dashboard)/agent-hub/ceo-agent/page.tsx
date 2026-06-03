"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  TrendingUp, 
  BarChart3,
  Sparkles,
  Zap,
  Target,
  Brain,
  Users,
  Quote,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const PRESETS = [
  { label: "Lead Performance", icon: Target, query: "How many leads did I get this week?" },
  { label: "Escalation Audit", icon: AlertCircle, query: "Why is my escalation rate high?" },
  { label: "Customer Insights", icon: MessageSquare, query: "Summarize my top customer complaints" },
  { label: "Optimization", icon: Zap, query: "How can I optimize my resolution rate?" }
]

const ThinkingIndicator = () => {
  const [step, setStep] = useState(0)
  const steps = ["Scanning metrics", "Analyzing trends", "Formulating insights"]

  useEffect(() => {
    const interval = setInterval(() => setStep(prev => (prev + 1) % steps.length), 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm"
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
          {steps[step]}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>...</motion.span>
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[#c65f39] text-[11px] font-mono">{part.slice(1, -1)}</code>
    return part
  })
}

const StructuredContent = ({ content }: { content: string }) => {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false

  lines.forEach((line, i) => {
    if (!line.trim()) {
      if (inList) { inList = false; elements.push(<div key={`sp-${i}`} className="h-2" />) }
      return
    }

    if (line.startsWith('### ')) {
      if (inList) { inList = false }
      elements.push(<h3 key={i} className="text-sm font-bold text-gray-900 mt-4 mb-1.5 flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-[#c65f39]" />{line.slice(4)}</h3>)
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

    if (line.startsWith('> ')) {
      if (inList) { inList = false }
      elements.push(
        <div key={i} className="flex gap-2 my-2 pl-3 border-l-2 border-[#c65f39]/30">
          <Quote size={12} className="text-[#c65f39]/50 mt-0.5 shrink-0" />
          <p className="text-[12px] text-gray-500 italic leading-relaxed">{renderInline(line.slice(2))}</p>
        </div>
      )
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { inList = true }
      elements.push(
        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 my-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c65f39]/60 mt-1.5 shrink-0" />
          <span>{renderInline(line.slice(2))}</span>
        </li>
      )
      return
    }
    if (inList) { inList = false; elements.push(<div key={`el-${i}`} className="h-1" />) }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-[13px] text-gray-700 my-1">
          <span className="h-5 w-5 rounded-lg bg-[#c65f39]/10 border border-[#c65f39]/20 text-[#c65f39] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{numberedMatch[1]}</span>
          <span className="pt-0.5">{renderInline(numberedMatch[2] ?? "")}</span>
        </div>
      )
      return
    }

    elements.push(<p key={i} className="text-[13px] text-gray-700 leading-relaxed mb-1">{renderInline(line)}</p>)
  })

  return <div className="space-y-0.5">{elements}</div>
}

export default function CeoAgentPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return
    const userMessage = text.trim()
    setInputText("")
    setIsSending(true)
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: Date.now().toString() }])

    try {
      const res = await fetch("/api/insights/ceo-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, agent_type: "business_analyst", reasoning: "deep" })
      })
      if (!res.ok) throw new Error("Synchronization failed")
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'analyst', content: data.reply, thought: data.thought, id: (Date.now() + 1).toString() }])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 border-b border-gray-100 shrink-0" style={{ height: 52 }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="h-8 w-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white shadow-sm">
            <TrendingUp size={15} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">CEO Analyst</h1>
            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Strategy Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
        </div>
      </header>

      {/* Chat */}
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <ScrollArea className="flex min-h-0 flex-1">
          <div className="max-w-2xl mx-auto py-6 px-5">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-16 space-y-10">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center text-white mx-auto shadow-xl shadow-black/10 relative">
                      <TrendingUp size={24} />
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">CEO Intelligence</h2>
                      <p className="text-[13px] text-gray-400 max-w-sm mx-auto leading-relaxed">Real-time analysis of your AI workforce performance, lead pipeline, and growth opportunities.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-w-xl mx-auto">
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
                      className={cn("flex flex-col gap-1.5", m.role === 'user' ? "items-end" : "items-start")}
                    >
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-xl shadow-sm",
                        m.role === 'user'
                          ? "bg-gray-900 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                      )}>
                        {m.role === 'user' ? m.content : <StructuredContent content={m.content} />}
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn("h-4 w-4 rounded-md flex items-center justify-center", m.role === 'user' ? "bg-gray-100" : "bg-[#c65f39]/10")}>
                          {m.role === 'user' ? <Users size={9} className="text-gray-400" /> : <Brain size={9} className="text-[#c65f39]" />}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          {m.role === 'user' ? 'You' : 'CEO Analyst'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {isSending && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start">
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
            <form onSubmit={(e) => { e.preventDefault(); handleSend(inputText) }} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl transition-all focus-within:border-gray-300 focus-within:shadow-sm">
              <Input 
                placeholder="Ask about your business performance..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 border-none shadow-none focus:ring-0 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none h-9 bg-transparent px-0"
                disabled={isSending}
              />
              <Button 
                type="submit" 
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center shrink-0",
                  inputText.trim() && !isSending
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                    : "bg-gray-50 text-gray-300"
                )}
                disabled={isSending || !inputText.trim()}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
