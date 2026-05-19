"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Bot,
  Send,
  ArrowLeft,
  Loader2,
  Terminal,
  ShieldCheck,
  Zap,
  Cpu,
  History,
  Copy,
  Check,
  Clock,
  Trash2,
  Download,
  MessageSquare,
  Target,
  Sparkles,
  ChevronDown,
  BarChart3,
  Timer,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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

interface DebugLog {
  id: string
  timestamp: string
  agentType: string
  responseTime: number
  handoffCount: number
  content: string
}

const AGENT_TYPES = [
  { id: 'customer_support', name: 'Customer Support', desc: 'Handle inquiries & support', icon: MessageSquare },
  { id: 'appointment_booking', name: 'Appointment Booker', desc: 'Schedule management', icon: Target },
  { id: 'sales', name: 'Sales Assistant', desc: 'Lead qualification', icon: Zap },
]

export default function TestChatPage() {
  const { workspaceId } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>("customer_support")
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || isSending || !workspaceId) return

    const userMessage = inputText.trim()
    setInputText("")
    setIsSending(true)

    const userMsg: Message = {
      role: 'customer',
      content: userMessage,
      timestamp: new Date(),
      id: crypto.randomUUID(),
    }
    setMessages(prev => [...prev, userMsg])

    const startTime = performance.now()

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

      const elapsed = Math.round(performance.now() - startTime)

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()

      const agentMsg: Message = {
        role: 'agent',
        content: data.reply,
        timestamp: new Date(),
        id: crypto.randomUUID(),
        responseTime: elapsed,
        agentType: selectedAgent,
        handoffCount: data.metadata?.handoff_count || 0,
      }
      setMessages(prev => [...prev, agentMsg])

      setTotalTokens(prev => prev + (data.metadata?.tokens_used || 0))

      const newAvg = messages.length > 0
        ? Math.round((avgResponseTime * messages.filter(m => m.responseTime).length + elapsed) / (messages.filter(m => m.responseTime).length + 1))
        : elapsed
      setAvgResponseTime(newAvg)

      setDebugLogs(prev => [{
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        agentType: selectedAgent,
        responseTime: elapsed,
        handoffCount: data.metadata?.handoff_count || 0,
        content: data.reply.substring(0, 80) + (data.reply.length > 80 ? '...' : ''),
      }, ...prev])

    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime)
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
  }, [inputText, isSending, workspaceId, selectedAgent, messages, avgResponseTime])

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    setMessages([])
    setDebugLogs([])
    setTotalTokens(0)
    setAvgResponseTime(0)
    toast.info("Chat cleared")
  }

  const handleExport = () => {
    const text = messages.map(m =>
      `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'customer' ? 'You' : 'Agent'}: ${m.content}`
    ).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Conversation exported")
  }

  const selectedAgentData = AGENT_TYPES.find(a => a.id === selectedAgent)

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Test Chat</h1>
            <p className="text-xs text-gray-500 font-medium">Simulate conversations with your AI agents</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Agent Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 shadow-sm"
            >
              {selectedAgentData && <selectedAgentData.icon className="h-4 w-4 text-gray-400" />}
              <span>{selectedAgentData?.name}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", showAgentDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showAgentDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/5 z-50 overflow-hidden"
                >
                  <div className="p-3 space-y-1">
                    {AGENT_TYPES.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => { setSelectedAgent(agent.id); setShowAgentDropdown(false) }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          selectedAgent === agent.id
                            ? "bg-[#c65f39]/5 border border-[#c65f39]/10"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center",
                          selectedAgent === agent.id ? "bg-[#c65f39] text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          <agent.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                          <p className="text-[10px] text-gray-500">{agent.desc}</p>
                        </div>
                        {selectedAgent === agent.id && (
                          <Check className="h-4 w-4 text-[#c65f39] ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 rounded-xl text-xs font-medium gap-1.5" disabled={messages.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 rounded-xl text-xs font-medium gap-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50" disabled={messages.length === 0}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pt-6">
        {/* Chat Area */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Chat Header */}
          <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">Active Simulation</span>
                <span className="text-[10px] text-gray-500 ml-2 font-medium">{selectedAgentData?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {messages.length > 0 && (
                <>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {messages.length} messages</span>
                  <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {avgResponseTime}ms avg</span>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-6 bg-white">
            <div className="space-y-5 max-w-2xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center space-y-6"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                      <Sparkles className="h-8 w-8 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">Ready to test</p>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">Send a message to simulate how your {selectedAgentData?.name} agent responds.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {["What are your business hours?", "I need to book an appointment", "Tell me about your pricing"].map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => { setInputText(suggestion); inputRef.current?.focus() }}
                          className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-200 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex flex-col gap-1",
                        m.role === 'customer' ? "items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-gray-400">
                          {m.role === 'customer' ? 'You' : m.agentType ? m.agentType.replace(/_/g, ' ') : 'Agent'}
                        </span>
                        <span className="text-[10px] text-gray-300">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.responseTime && m.role === 'agent' && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {m.responseTime}ms
                          </span>
                        )}
                      </div>
                      <div className="group relative">
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%]",
                          m.role === 'customer'
                            ? "bg-gray-900 text-white rounded-tr-sm"
                            : m.error
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-sm"
                              : "bg-gray-100 text-gray-900 rounded-tl-sm"
                        )}>
                          {m.content}
                        </div>
                        {m.role === 'agent' && (
                          <button
                            onClick={() => handleCopy(m.content, m.id)}
                            className="absolute -right-8 top-2 h-6 w-6 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            {copiedId === m.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                      {m.handoffCount && m.handoffCount > 0 && (
                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                          <ArrowUpRight className="h-2.5 w-2.5" /> {m.handoffCount} agent handoff{m.handoffCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100">
                    <div className="flex gap-1">
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Type a message to test the agent..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="h-12 pl-4 pr-14 rounded-xl bg-white border-gray-200 focus:border-[#c65f39]/30 focus:ring-[#c65f39]/10 transition-all text-sm shadow-sm"
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
                  className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
                  disabled={isSending || !inputText.trim()}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">Press Enter to send • Test messages are isolated from production data</p>
            </form>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Messages</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{messages.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg Response</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{avgResponseTime}<span className="text-sm font-normal text-gray-400 ml-0.5">ms</span></p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Handoffs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{messages.reduce((sum, m) => sum + (m.handoffCount || 0), 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tokens</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{totalTokens > 0 ? totalTokens.toLocaleString() : '—'}</p>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm min-h-0">
            <div className="h-11 px-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-900">Debug Logs</span>
              </div>
              {debugLogs.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-medium">{debugLogs.length}</Badge>
              )}
            </div>
            <ScrollArea className="flex-1 p-4">
              {debugLogs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <History className="h-6 w-6 text-gray-200 mx-auto" />
                  <p className="text-[11px] text-gray-400 font-medium">No logs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debugLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium text-gray-500">{log.timestamp}</span>
                        <Badge variant="secondary" className="text-[9px] font-medium capitalize bg-white border-gray-200">{log.agentType.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] text-gray-400 font-medium">Response Time</p>
                          <p className="text-xs font-semibold text-gray-900">{log.responseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-medium">Handoffs</p>
                          <p className="text-xs font-semibold text-gray-900">{log.handoffCount}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed truncate">{log.content}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-xl bg-gray-900 text-white shadow-sm">
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold leading-none">Test Environment</p>
                <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
                  Messages are marked as test data and won't affect production analytics or customer records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
