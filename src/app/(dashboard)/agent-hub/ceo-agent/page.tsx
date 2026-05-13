"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Bot, 
  Send, 
  ArrowLeft, 
  Loader2, 
  TrendingUp, 
  BarChart2, 
  Sparkles,
  Zap,
  Target,
  MessageSquare,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const PRESETS = [
  "How many leads did I get this week?",
  "Why is my escalation rate high?",
  "Summarize my top customer complaints",
  "How can I optimize my resolution rate?"
]

export default function CeoAgentPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
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
        body: JSON.stringify({ message: userMessage })
      })

      if (!res.ok) throw new Error("Synchronization failed")
      const data = await res.json()
      
      setMessages(prev => [...prev, { role: 'analyst', content: data.reply, id: (Date.now() + 1).toString() }])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-sans">
      {/* Premium Analyst Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="h-10 w-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <Zap className="h-3 w-3 text-[#D95E46] fill-[#D95E46]" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-[#D95E46]">Pro Business Feature</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">CEO Analyst</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-gray-100" />
              ))}
           </div>
           <span className="text-[11px] font-medium text-gray-400 italic">Trusted by 500+ teams</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none" />
         
         <ScrollArea className="flex-1 px-8 py-10 relative z-10">
            <div className="max-w-3xl mx-auto space-y-10">
               <AnimatePresence initial={false}>
                 {messages.length === 0 ? (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-20 text-center space-y-8"
                   >
                      <div className="h-20 w-20 rounded-[2rem] bg-gray-900 flex items-center justify-center mx-auto text-white shadow-xl relative group cursor-pointer hover:scale-105 transition-all">
                         <TrendingUp className="h-8 w-8" />
                         <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#D95E46] animate-ping opacity-75" />
                      </div>
                      <div className="space-y-3">
                         <h2 className="text-xl font-semibold text-gray-900">Expert Business Consultant</h2>
                         <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">Ask me anything about your performance data. I provide direct, data-driven analysis to help you scale.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-4">
                         {PRESETS.map((text, i) => (
                           <button 
                             key={i} 
                             onClick={() => handleSend(text)}
                             className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-[#D95E46]/30 hover:shadow-md transition-all text-left text-xs font-medium text-gray-600 group flex items-center justify-between"
                           >
                              <span className="line-clamp-1">{text}</span>
                              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      className={cn(
                        "flex flex-col gap-3",
                        m.role === 'user' ? "items-end" : "items-start"
                      )}
                     >
                        <div className={cn(
                          "px-6 py-4 rounded-2xl text-[14px] leading-relaxed max-w-[85%] font-medium shadow-sm",
                          m.role === 'user' 
                            ? "bg-gray-900 text-white rounded-tr-sm" 
                            : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm"
                        )}>
                          {m.content}
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                              {m.role === 'user' ? 'Executive' : 'Analyst Agent'}
                           </span>
                        </div>
                     </motion.div>
                   ))
                 )}
               </AnimatePresence>
               <div ref={scrollRef} />
            </div>
         </ScrollArea>

         {/* Input Box */}
         <div className="p-6 bg-gray-50/50 border-t border-gray-100 relative z-10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputText) }} 
              className="max-w-3xl mx-auto flex gap-3"
            >
               <div className="relative flex-1">
                  <Input 
                    placeholder="Ask about your business performance..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="h-14 pl-6 pr-4 rounded-xl border-gray-200 bg-white focus:border-gray-900 transition-all text-sm shadow-sm"
                    disabled={isSending}
                  />
               </div>
               <Button 
                type="submit" 
                className="h-14 px-8 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all active:scale-95 shadow-md flex items-center gap-2"
                disabled={isSending || !inputText.trim()}
               >
                 {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                 <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Query</span>
               </Button>
            </form>
         </div>
      </div>
    </div>
  )
}
