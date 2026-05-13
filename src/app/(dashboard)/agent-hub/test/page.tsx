"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Bot, 
  Send, 
  ArrowLeft, 
  Loader2, 
  Terminal,
  ShieldCheck,
  Zap,
  Cpu,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/use-workspace"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: 'customer' | 'agent'
  content: string
}

interface DebugLog {
  timestamp: string
  intent?: string
  confidence?: number
  tools?: string[]
}

export default function TestChatPage() {
  const { workspaceId, isLoading: isWsLoading } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>("customer_support")
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSending || !workspaceId) return

    const userMessage = inputText.trim()
    setInputText("")
    setIsSending(true)

    const messageId = crypto.randomUUID()
    const newUserMsg: Message = { role: 'customer', content: userMessage, id: messageId }
    setMessages(prev => [...prev, newUserMsg])

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

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: data.reply, 
        id: crypto.randomUUID() 
      }])
      
      setDebugLogs(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        intent: data.metadata?.intent,
        confidence: data.metadata?.confidence,
        tools: data.metadata?.tools_called
      }, ...prev])

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PageTransition>
      <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Test Chat</h1>
              <p className="text-sm text-gray-500">Test your agents in an isolated environment.</p>
            </div>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
             {['customer_support', 'appointment_booking', 'sales'].map((t) => (
               <button
                 key={t}
                 onClick={() => setSelectedAgent(t)}
                 className={cn(
                   "px-4 py-2 text-xs font-semibold capitalize rounded-md transition-all",
                   selectedAgent === t 
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                    : "text-gray-500 hover:text-gray-700"
                 )}
               >
                 {t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          {/* Chat Agent Layer */}
          <div className="lg:col-span-8 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
             <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                      <Bot className="h-4 w-4" />
                   </div>
                   <div>
                      <span className="text-sm font-semibold text-gray-900">Active Simulation</span>
                   </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMessages([])} 
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                   Clear Chat
                </Button>
             </div>

             <ScrollArea className="flex-1 px-8 py-6 bg-white">
                <div className="space-y-6 max-w-3xl mx-auto">
                   <AnimatePresence initial={false}>
                     {messages.length === 0 ? (
                       <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center space-y-4"
                       >
                          <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
                             <Bot className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-sm font-semibold text-gray-900">Ready to test</p>
                             <p className="text-xs text-gray-500">Send a message to start simulating.</p>
                          </div>
                       </motion.div>
                     ) : (
                       messages.map((m, idx) => (
                         <motion.div 
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "flex flex-col gap-1.5",
                            m.role === 'customer' ? "items-end" : "items-start"
                          )}
                         >
                            <div className={cn(
                              "px-5 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%]",
                              m.role === 'customer' 
                                ? "bg-gray-900 text-white rounded-tr-sm" 
                                : "bg-gray-100 text-gray-900 rounded-tl-sm"
                            )}>
                              {m.content}
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 px-1">
                              {m.role === 'customer' ? 'You' : 'Agent'}
                            </span>
                         </motion.div>
                       ))
                     )}
                   </AnimatePresence>
                   <div ref={scrollRef} />
                </div>
             </ScrollArea>

             <div className="p-4 bg-gray-50 border-t border-gray-100">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                   <div className="relative">
                      <Input 
                        placeholder="Type a message..." 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="h-12 pl-4 pr-14 rounded-lg bg-white border-gray-200 focus:ring-1 focus:ring-gray-300 transition-all text-sm shadow-sm"
                        disabled={isSending}
                      />
                      <Button 
                        type="submit"
                        size="icon" 
                        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center justify-center"
                        disabled={isSending || !inputText.trim()}
                      >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                   </div>
                </form>
             </div>
          </div>

          {/* Tactical Analytics Side */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
             <Card className="flex-1 bg-white border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <CardHeader className="h-14 flex flex-row items-center justify-between px-6 py-0 border-b border-gray-100 bg-gray-50/50">
                   <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-gray-500" /> Test Logs
                   </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden bg-white">
                   <ScrollArea className="h-full p-6">
                      {debugLogs.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-2">
                           <History className="h-8 w-8 text-gray-300" />
                           <span className="text-xs text-gray-400 font-medium">No logs yet</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           {debugLogs.map((log, i) => (
                             <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3"
                             >
                                <div className="flex justify-between items-center">
                                   <span className="text-[10px] font-medium text-gray-500">{log.timestamp}</span>
                                   <span className="text-[10px] font-semibold text-gray-700 uppercase">LOG</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <p className="text-[10px] text-gray-500 font-medium mb-0.5">Intent</p>
                                      <p className="text-xs text-gray-900 font-semibold">{log.intent || "Unknown"}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] text-gray-500 font-medium mb-0.5">Confidence</p>
                                      <div className="flex items-center gap-2">
                                         <p className="text-xs text-emerald-600 font-semibold">{((log.confidence || 0) * 100).toFixed(1)}%</p>
                                      </div>
                                   </div>
                                </div>
                                {(log.tools?.length ?? 0) > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                     <p className="text-[10px] text-gray-500 font-medium">Tools Called</p>
                                     <div className="flex flex-wrap gap-1.5">
                                        {log.tools?.map((t: string) => (
                                          <Badge key={t} variant="secondary" className="bg-white border-gray-200 text-gray-700 text-[10px]">{t}</Badge>
                                        ))}
                                     </div>
                                  </div>
                                )}
                             </motion.div>
                           ))}
                        </div>
                      )}
                   </ScrollArea>
                </CardContent>
             </Card>

             <div className="p-6 rounded-xl bg-gray-900 text-white shadow-md">
                <div className="flex gap-4 items-center">
                   <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-none">Test Environment</p>
                      <p className="text-xs text-gray-400">
                         Data generated here will not affect your production metrics.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
