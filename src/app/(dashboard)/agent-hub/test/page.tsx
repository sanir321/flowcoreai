"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Send,
  Loader2,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  MessageSquare,
  Target,
  Zap,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"

interface ToolCall {
  tool: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>
  success: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any
  duration_ms: number
}

interface Message {
  id: string
  role: 'customer' | 'agent'
  content: string
  timestamp: Date
  responseTime?: number
  agentType?: string
  pipelineTier?: string
  toolCalls?: ToolCall[]
  error?: boolean
}

const AGENT_TYPES = [
  { id: 'customer_support', name: 'Support', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', suggestions: [
    "What are your business hours?",
    "Tell me about your services",
    "How do I contact you?",
  ]},
  { id: 'appointment_booking', name: 'Booking', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', suggestions: [
    "I need to book an appointment",
    "Do you have any slots tomorrow?",
    "Cancel my appointment",
  ]},
  { id: 'sales', name: 'Sales', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', suggestions: [
    "What products do you have?",
    "I need a price quote",
    "Do you have that in stock?",
  ]},
]

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  greeting: { label: 'Greeting', color: 'text-emerald-600 bg-emerald-50' },
  t1_cache: { label: 'Cache', color: 'text-blue-600 bg-blue-50' },
  t2_router: { label: 'Router', color: 'text-violet-600 bg-violet-50' },
  t3_plan_execute: { label: 'AI Agent', color: 'text-amber-600 bg-amber-50' },
  t3_escalation_handoff: { label: 'Escalation', color: 'text-red-600 bg-red-50' },
  t3_fallback_required_failed: { label: 'Fallback', color: 'text-orange-600 bg-orange-50' },
  t3_plan_error: { label: 'Error', color: 'text-red-600 bg-red-50' },
  t3_stale_message: { label: 'Stale', color: 'text-gray-600 bg-gray-50' },
  crash: { label: 'Crash', color: 'text-red-600 bg-red-50' },
}

export default function TestChatPage() {
  const { workspaceId } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("customer_support")
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [debugOpen, setDebugOpen] = useState(true)
  const [selectedDebugMsg, setSelectedDebugMsg] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

      const agentMsg: Message = {
        role: 'agent',
        content: data.reply,
        timestamp: new Date(),
        id: crypto.randomUUID(),
        responseTime: elapsed,
        agentType: data.metadata?.agent_type || selectedAgent,
        pipelineTier: data.metadata?.reason || 'unknown',
        toolCalls: data.metadata?.tool_calls || [],
      }

      setMessages(prev => [...prev, agentMsg])
      setSelectedDebugMsg(agentMsg.id)
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

  const agentData = AGENT_TYPES.find(a => a.id === selectedAgent)!
  const agentMessages = messages.filter(m => m.role === 'agent')
  return (
    <div className="flex min-h-0 flex-1 bg-gray-50/50 font-sans">
      <AssistantsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 border-b border-gray-100 bg-white shrink-0" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white shadow-sm">
              <Bot size={15} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Test Chat</h1>
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Agent Playground</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Selector */}
            <div className="relative">
              <button
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium",
                  agentData.bg, agentData.color, "border-current/10"
                )}
              >
                <agentData.icon className="h-3 w-3" />
                <span>{agentData.name}</span>
                <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", showAgentMenu && "rotate-180")} />
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

            {/* Debug Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugOpen(!debugOpen)}
              className={cn(
                "h-8 px-3 rounded-xl text-xs font-medium transition-all",
                debugOpen ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Terminal className="h-3 w-3 mr-1.5" />
              Debug
            </Button>

            {/* Clear */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMessages([]); setSelectedDebugMsg(null); toast.info("Chat cleared") }}
              className="h-8 px-3 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              disabled={messages.length === 0}
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-h-0 flex-1 p-3 gap-3">
          {/* Chat Panel */}
          <div className="flex flex-1 flex-col border border-gray-200 rounded-xl overflow-hidden bg-white min-w-0 shadow-sm">
            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                        <Terminal className="h-6 w-6 text-gray-300" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-gray-900">Ready to test</p>
                        <p className="text-xs text-gray-500">Send a message to simulate your {agentData.name.toLowerCase()} agent</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                        {agentData.suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => { setInputText(s); inputRef.current?.focus() }}
                            className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-all"
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
                        {/* Label row */}
                        <div className="flex items-center gap-2 mb-1">
                          {m.role === 'agent' ? (
                            <div className="flex items-center gap-1.5">
                              <div className={cn("h-5 w-5 rounded-lg flex items-center justify-center", agentData.bg)}>
                                <agentData.icon className={cn("h-2.5 w-2.5", agentData.color)} />
                              </div>
                              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                {AGENT_TYPES.find(a => a.id === m.agentType)?.name || 'Agent'}
                              </span>
                              {m.pipelineTier && (
                                <span className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                                  TIER_LABELS[m.pipelineTier]?.color || "text-gray-500 bg-gray-50"
                                )}>
                                  {TIER_LABELS[m.pipelineTier]?.label || m.pipelineTier}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">You</span>
                          )}
                          <span className="text-[10px] text-gray-300">
                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.responseTime && m.role === 'agent' && (
                            <span className="text-[10px] text-gray-400 font-medium">{m.responseTime}ms</span>
                          )}
                        </div>

                        {/* Message bubble */}
                        <div className="group relative max-w-[85%]">
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                            m.role === 'customer'
                              ? "bg-gray-900 text-white rounded-br-md"
                              : m.error
                                ? "bg-red-50 text-red-700 border border-red-100 rounded-bl-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                          )}>
                            {m.content}
                          </div>
                          {m.role === 'agent' && !m.error && (
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="absolute -right-8 top-2 h-6 w-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              {copiedId === m.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          )}
                        </div>

                        {/* Tool calls indicator */}
                        {m.role === 'agent' && m.toolCalls && m.toolCalls.length > 0 && (
                          <button
                            onClick={() => setSelectedDebugMsg(m.id === selectedDebugMsg ? null : m.id)}
                            className={cn(
                              "flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                              selectedDebugMsg === m.id
                                ? "bg-amber-50 text-amber-600"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            <Wrench className="h-2.5 w-2.5" />
                            {m.toolCalls.length} tool{m.toolCalls.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>

                {isSending && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
                    <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md bg-gray-100">
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="h-1.5 w-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message ${agentData.name.toLowerCase()} agent...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
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
                  className="h-10 w-10 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all shrink-0 disabled:opacity-50 shadow-sm"
                  disabled={isSending || !inputText.trim()}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>

          {/* Debug Panel */}
          <AnimatePresence>
            {debugOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white min-h-0 shadow-sm"
              >
                <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-900">Debug Panel</span>
                  </div>
                  <button
                    onClick={() => setDebugOpen(false)}
                    className="h-5 w-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <ScrollArea className="flex-1">
                  {agentMessages.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">No activity yet</p>
                      <p className="text-[10px] text-gray-300 mt-1">Send a message to see the pipeline trace</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      {agentMessages.map((m) => {
                        const isSelected = selectedDebugMsg === m.id
                        const tier = TIER_LABELS[m.pipelineTier || '']
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelectedDebugMsg(isSelected ? null : m.id)}
                            className={cn(
                              "w-full p-2.5 rounded-lg border text-left transition-all space-y-1.5",
                              isSelected
                                ? "bg-gray-50 border-gray-200 shadow-sm"
                                : "bg-white border-gray-100 hover:border-gray-200"
                            )}
                          >
                            {/* Tier + Time */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {tier && (
                                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider", tier.color)}>
                                    {tier.label}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">{m.responseTime}ms</span>
                            </div>

                            {/* Response preview */}
                            <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{m.content}</p>

                            {/* Tool calls */}
                            {isSelected && m.toolCalls && m.toolCalls.length > 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-gray-100 space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tool Calls</span>
                                {m.toolCalls.map((tc, i) => (
                                  <div key={i} className="p-2 rounded-lg bg-white border border-gray-100 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-[10px] font-mono font-bold text-gray-700">{tc.tool}</code>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-400">{tc.duration_ms}ms</span>
                                        {tc.success ? (
                                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                          <AlertTriangle className="h-3 w-3 text-red-500" />
                                        )}
                                      </div>
                                    </div>
                                    {!tc.success && tc.result && (
                                      <p className="text-[9px] text-red-500 font-mono truncate">{String(tc.result)}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {isSelected && m.toolCalls && m.toolCalls.length === 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 italic">No tools called — handled by {tier?.label || 'pipeline'}</p>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
