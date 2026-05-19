"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Send,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  MessageSquare,
  Target,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWorkspace } from "@/hooks/use-workspace"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: 'customer' | 'agent'
  content: string
  timestamp: Date
  responseTime?: number
  agentType?: string
  handoffCount?: number
  error?: boolean
}

const AGENT_TYPES = [
  { id: 'customer_support', name: 'Customer Support', icon: MessageSquare },
  { id: 'appointment_booking', name: 'Appointment Booker', icon: Target },
  { id: 'sales', name: 'Sales Assistant', icon: Zap },
]

export default function TestChatPage() {
  const { workspaceId } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("customer_support")
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || isSending || !workspaceId) return

    const userMessage = inputText.trim()
    setInputText("")
    setIsSending(true)

    setMessages(prev => [...prev, {
      role: 'customer',
      content: userMessage,
      timestamp: new Date(),
      id: crypto.randomUUID(),
    }])

    const start = performance.now()

    try {
      const res = await fetch("/api/agent-hub/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          message: userMessage,
          agent_type: selectedAgent
        })
      })

      const elapsed = Math.round(performance.now() - start)

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.reply,
        timestamp: new Date(),
        id: crypto.randomUUID(),
        responseTime: elapsed,
        agentType: selectedAgent,
        handoffCount: data.metadata?.handoff_count || 0,
      }])
    } catch (error) {
      const elapsed = Math.round(performance.now() - start)
      setMessages(prev => [...prev, {
        role: 'agent',
        content: error instanceof Error ? error.message : "An error occurred",
        timestamp: new Date(),
        id: crypto.randomUUID(),
        responseTime: elapsed,
        error: true,
      }])
      toast.error("Failed to get agent response")
    } finally {
      setIsSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [inputText, isSending, workspaceId, selectedAgent])

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const selectedAgentData = AGENT_TYPES.find(a => a.id === selectedAgent)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Test Chat</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowAgentMenu(!showAgentMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all text-xs font-medium text-gray-700"
            >
              {selectedAgentData && <selectedAgentData.icon className="h-3 w-3 text-gray-400" />}
              <span>{selectedAgentData?.name}</span>
              <ChevronDown className={cn("h-2.5 w-2.5 text-gray-400 transition-transform", showAgentMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showAgentMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/5 z-50 overflow-hidden"
                >
                  <div className="p-1.5 space-y-0.5">
                    {AGENT_TYPES.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => { setSelectedAgent(agent.id); setShowAgentMenu(false) }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-xs",
                          selectedAgent === agent.id ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <agent.icon className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{agent.name}</span>
                        {selectedAgent === agent.id && <Check className="h-3 w-3 text-[#c65f39] ml-auto" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMessages([]); toast.info("Chat cleared") }}
            className="h-8 px-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900"
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0 p-3">
        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                      <Terminal className="h-5 w-5 text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">Ready to test</p>
                      <p className="text-xs text-gray-500">Send a message to simulate your agent</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                      {["What are your business hours?", "I need to book an appointment", "Tell me about your pricing"].map(s => (
                        <button
                          key={s}
                          onClick={() => { setInputText(s); inputRef.current?.focus() }}
                          className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex flex-col", m.role === 'customer' ? "items-end" : "items-start")}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-gray-400">
                          {m.role === 'customer' ? 'You' : m.agentType?.replace(/_/g, ' ') || 'Agent'}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.responseTime && m.role === 'agent' && (
                          <span className="text-[10px] text-gray-400">{m.responseTime}ms</span>
                        )}
                      </div>
                      <div className="group relative">
                        <div className={cn(
                          "px-3.5 py-2 rounded-xl text-[13px] leading-relaxed max-w-[80%]",
                          m.role === 'customer'
                            ? "bg-gray-900 text-white rounded-tr-sm"
                            : m.error
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-sm"
                              : "bg-gray-100 text-gray-900 rounded-tl-sm"
                        )}>
                          {m.content}
                        </div>
                        {m.role === 'agent' && !m.error && (
                          <button
                            onClick={() => handleCopy(m.content, m.id)}
                            className="absolute -right-6 top-1.5 h-5 w-5 rounded bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            {copiedId === m.id ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                          </button>
                        )}
                      </div>
                      {m.handoffCount && m.handoffCount > 0 && (
                        <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                          {m.handoffCount} handoff{m.handoffCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {isSending && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl rounded-tl-sm bg-gray-100">
                    <motion.div className="h-1 w-1 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
                    <motion.div className="h-1 w-1 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                    <motion.div className="h-1 w-1 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#c65f39]/20 focus:border-[#c65f39]/30 transition-all"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all shrink-0 disabled:opacity-50"
                disabled={isSending || !inputText.trim()}
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Debug */}
        <div className="lg:col-span-1 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white min-h-0">
          <div className="h-9 px-3 flex items-center gap-2 border-b border-gray-100 shrink-0">
            <Terminal className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-semibold text-gray-900">Debug</span>
          </div>
          <ScrollArea className="flex-1">
            {messages.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[11px] text-gray-400 font-medium">No activity yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {messages.filter(m => m.role === 'agent').map((m) => (
                  <div key={m.id} className="p-2 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-500">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-gray-400">{m.responseTime}ms</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
