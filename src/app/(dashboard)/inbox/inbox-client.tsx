"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Search, 
  Inbox, 
  Send,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Info,
  Edit3,
  Settings,
  Search as SearchIcon,
  Wifi,
  WifiOff
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { sendManualReply, resolveEscalation, takeOverSession } from "@/app/actions/inbox"
import { sendManualMessage } from "@/app/actions/contacts"
import { updateWelcomeTemplate } from "@/app/actions/workspace"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Contact {
  id: string
  name: string
  phone: string
  avatar_url?: string
}
interface Session {
  id: string
  workspace_id: string
  status: 'active' | 'escalated' | 'resolved'
  last_message_at: string
  last_message_preview?: string
  contacts: Contact
  channel: string
  agent_type?: string
  typing_status?: 'idle' | 'searching_history' | 'analyzing_intent' | 'checking_knowledge' | 'executing_tool' | 'generating_response'
}

interface Message {
  id: string
  role: 'customer' | 'agent' | 'system'
  content: string
  created_at: string
  direction?: 'inbound' | 'outbound'
  agent_type?: string
  metadata?: Record<string, unknown>
}

interface InboxClientProps {
  initialSessions: Session[]
  initialContacts: Contact[]
  initialWelcomeTemplate: string
  workspaceId: string
}

export function InboxClient({ 
  initialSessions, 
  initialContacts,
  initialWelcomeTemplate,
  workspaceId 
}: InboxClientProps) {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [contacts] = useState<Contact[]>(initialContacts)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<"todo" | "handling" | "done">("todo")
  const [search, setSearch] = useState("")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isSettingsOpen, setIsComposeSettingsOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [composeMessage, setManualComposeMessage] = useState("")
  const [welcomeTemplate, setWelcomeTemplate] = useState(initialWelcomeTemplate)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [contactSearch, setContactSearch] = useState("")
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedSession = sessions.find(s => s.id === selectedSessionId)

  const formatAgentType = (type?: string) => {
    switch (type) {
        case 'appointment_booking': return "Booking"
        case 'sales': return "Sales"
        case 'customer_support': return "Support"
        default: return "Support"
    }
  }

  const fetchMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true })
    setMessages((data as Message[]) || [])
  }, [supabase])

  // Real-time for sessions
  useEffect(() => {
    const sessionChannel = supabase
      .channel("inbox-sessions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { 
        event: "*", 
        schema: "public", 
        table: "conversation_sessions",
        filter: `workspace_id=eq.${workspaceId}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        if (payload.eventType === 'UPDATE') {
          setSessions(prev => {
            const updated = prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
            return [...updated].sort((a, b) => 
              new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
            )
          })
        } else {
          // Re-fetch everything if a new session is created or deleted
          // to keep logic simple for now. In a larger app, handle specifically.
          const fetchAll = async () => {
            const { data } = await supabase
              .from("conversation_sessions")
              .select("*, contacts(*)")
              .eq("workspace_id", workspaceId)
              .is("deleted_at", null)
              .order("last_message_at", { ascending: false })
            setSessions((data as unknown as Session[]) || [])
          }
          fetchAll()
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error')
      })

    return () => { void supabase.removeChannel(sessionChannel) }
  }, [workspaceId, supabase])

  // Real-time for messages
  useEffect(() => {
    if (selectedSessionId) {
      void fetchMessages(selectedSessionId)
      const msgChannel = supabase
        .channel(`msgs-${selectedSessionId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${selectedSessionId}` }, 
          (payload: { new: Message }) => setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        )
        .subscribe()

      return () => { void supabase.removeChannel(msgChannel) }
    } else {
      setMessages([])
    }
  }, [selectedSessionId, fetchMessages, supabase])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSending || !selectedSessionId || !workspaceId) return
    
    const text = inputText.trim()
    setInputText("")
    setIsSending(true)

    // Optimistic Update
    const optimisticMsg = {
      id: `temp-${crypto.randomUUID()}`,
      content: text,
      role: 'agent' as const,
      direction: 'outbound' as const,
      created_at: new Date().toISOString(),
      session_id: selectedSessionId,
      metadata: { manual_reply: true }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(prev => [...prev, optimisticMsg as any])

    const result = await sendManualReply({ session_id: selectedSessionId, content: text })
    if (result.error) {
      toast.error(result.error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    } else {
      setMessages(prev => {
        if (prev.some(m => m.id === result.data.id)) {
          return prev.filter(m => m.id !== optimisticMsg.id)
        }
        return prev.map(m => m.id === optimisticMsg.id ? result.data : m)
      })
    }
    setIsSending(false)
  }

  const handleComposeSend = async () => {
    if (!selectedContact || !composeMessage.trim() || !workspaceId) return

    setIsSending(true)
    const result = await sendManualMessage({
      workspace_id: workspaceId,
      phone: selectedContact.phone,
      message: composeMessage,
      contact_id: selectedContact.id
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Message sent")
      setManualComposeMessage("")
      setIsComposeOpen(false)
    }
    setIsSending(false)
  }

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true)
    const result = await updateWelcomeTemplate(workspaceId, welcomeTemplate)
    if (result.error) toast.error(result.error)
    else {
      toast.success("Welcome template updated")
      setIsComposeSettingsOpen(false)
    }
    setIsSavingTemplate(false)
  }

  const handleTakeOver = async () => {
    if (!selectedSessionId) return
    setIsUpdatingStatus(true)
    const result = await takeOverSession({ session_id: selectedSessionId })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Assistant Paused. You have control.")
      setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, status: 'escalated' } : s))
      setActiveTab("todo")
    }
    setIsUpdatingStatus(false)
  }

  const handleResolve = async () => {
    if (!selectedSessionId) return
    setIsUpdatingStatus(true)
    const { data: log } = await supabase
        .from("escalation_logs")
        .select("id")
        .eq("session_id", selectedSessionId)
        .eq("status", "open")
        .maybeSingle()

    let success = false
    if (log) {
        const result = await resolveEscalation({ escalation_id: log.id, notes: "Manually resolved" })
        if (result.error) toast.error(result.error)
        else success = true
    } else {
        const { error } = await supabase
            .from("conversation_sessions")
            .update({ status: 'active' })
            .eq("id", selectedSessionId)
        
        if (error) toast.error(error.message)
        else success = true
    }

    if (success) {
      toast.success("Automation resumed.")
      setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, status: 'active' } : s))
      setActiveTab("handling")
    }
    setIsUpdatingStatus(false)
  }

  const filteredSessions = sessions.filter(s => {
    const matchesTab = 
      activeTab === 'todo' ? s.status === 'escalated' :
      activeTab === 'handling' ? s.status === 'active' :
      ['resolved', 'idle'].includes(s.status)
    
    const matchesSearch = (s.contacts?.name || '').toLowerCase().includes(search.toLowerCase()) || 
                         (s.contacts?.phone || '').includes(search)
    
    return matchesTab && matchesSearch
  })

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
    (c.phone || '').includes(contactSearch)
  )

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans min-h-0 text-gray-900">
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Session List (Left Pane) */}
        <div className={cn(
          "w-full md:w-80 lg:w-72 border-r border-gray-100 flex flex-col bg-white shrink-0 z-20 min-h-0",
          selectedSessionId ? "hidden md:flex" : "flex"
        )}>
           <div className="p-4 md:p-5 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                 <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                     Inbox
                     <button 
                         onClick={() => setIsComposeOpen(true)}
                         className="h-7 w-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all active:scale-95"
                     >
                         <Edit3 className="h-3.5 w-3.5" />
                     </button>
                     <button 
                         onClick={() => setIsComposeSettingsOpen(true)}
                         className="h-7 w-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all active:scale-95"
                     >
                         <Settings className="h-3.5 w-3.5" />
                     </button>
                 </h2>
                 <div className="flex items-center gap-2">
                     <div className={cn(
                         "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-semibold",
                         realtimeStatus === 'connected' ? "border-emerald-100 bg-emerald-50 text-emerald-600" :
                         realtimeStatus === 'error' ? "border-rose-100 bg-rose-50 text-rose-600" :
                         "border-gray-200 bg-gray-50 text-gray-500"
                     )}>
                         {realtimeStatus === 'connected' ? <><Wifi className="h-2 w-2" /> Live</> :
                          realtimeStatus === 'error' ? <><WifiOff className="h-2 w-2" /> Polling</> :
                          "Syncing"}
                     </div>
                     <Badge className="bg-[#c65f39] text-white border-none text-[9px] px-1.5 h-4 font-semibold">{filteredSessions.length}</Badge>
                 </div>
              </div>
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 group-focus-within:text-black transition-colors" />
                 <Input 
                   placeholder="Search..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="h-9 pl-8 pr-3 bg-gray-50/50 border-gray-100 rounded-lg text-xs font-medium focus:bg-white transition-all"
                 />
              </div>
           </div>

           <div className="h-10 border-b border-gray-100 flex items-center px-4 md:px-5 gap-4 bg-white shrink-0">
              {([
                { id: 'todo', label: 'To do' },
                { id: 'handling', label: 'Active' },
                { id: 'done', label: 'Done' }
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold transition-all relative h-full px-1 flex items-center",
                    activeTab === t.id ? "text-black" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {t.label}
                  {activeTab === t.id && (
                    <motion.div 
                      layoutId="inboxTab" 
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" 
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
           </div>

           <ScrollArea className="flex-1 min-h-0">
              <div className="divide-y divide-gray-50">
                 {filteredSessions.length === 0 ? (
                   <div className="py-12 text-center space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto">
                         <Inbox className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-[10px] font-medium text-gray-500">No conversations found</p>
                   </div>
                 ) : (
                   filteredSessions.map((s) => (
                     <button
                        key={s.id}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={cn(
                          "w-full h-16 px-4 md:px-5 text-left hover:bg-gray-50 transition-all flex flex-col justify-center gap-1 group relative",
                          selectedSessionId === s.id && "bg-gray-50"
                        )}
                     >
                        <div className="flex justify-between items-center w-full text-gray-900">
                           <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate max-w-[120px] md:max-w-[160px] tracking-tight">{s.contacts?.name || "Unknown Contact"}</span>
                              {s.status === 'escalated' && <div className="h-1.5 w-1.5 rounded-full bg-[#c65f39]" />}
                           </div>
                           <span className="text-[9px] font-semibold text-gray-500">
                              {s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                           </span>
                        </div>
                        <div className="flex items-center gap-1">
                           <Badge variant="outline" className="text-[8px] font-semibold px-1 h-3.5 border-gray-200 text-gray-500 bg-white">{s.channel}</Badge>
                           <Badge variant="outline" className="text-[8px] font-semibold px-1 h-3.5 border-[#c65f39]/20 text-[#c65f39] bg-[#c65f39]/5 tracking-tight">
                              {formatAgentType(s.agent_type)}
                           </Badge>
                        </div>
                        {selectedSessionId === s.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c65f39]" />}
                     </button>
                   ))
                 )}
              </div>
           </ScrollArea>
        </div>

        {/* Conversation Thread (Right Pane) */}
        <div className={cn(
          "flex-1 flex flex-col bg-white relative z-10 min-h-0",
          !selectedSessionId ? "hidden md:flex" : "flex"
        )}>
           {selectedSession ? (
             <>
               {/* Thread Header */}
               <div className="h-14 px-4 md:px-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSelectedSessionId(null)} className="md:hidden h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:text-black mr-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                     </button>
                     <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-semibold text-[10px]">
                        {selectedSession.contacts?.name?.charAt(0) || "U"}
                     </div>
                     <div className="flex flex-col text-gray-900">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-semibold tracking-tight">{selectedSession.contacts?.name || "Anonymous contact"}</span>
                           <Badge className="bg-[#c65f39]/10 text-[#c65f39] border-none text-[8px] font-semibold px-1.5 h-4">
                              {formatAgentType(selectedSession.agent_type)}
                           </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                            <span className="text-[9px] font-medium text-gray-500">{selectedSession.contacts?.phone || "No contact info"}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-900">
                     {selectedSession.status === 'active' ? (
                        <Button 
                          onClick={handleTakeOver}
                          disabled={isUpdatingStatus}
                          className="h-8 px-4 rounded-lg bg-black hover:bg-gray-800 text-white text-[9px] font-semibold transition-all active:scale-95 gap-1.5"
                        >
                           {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                           Take Over
                        </Button>
                     ) : (
                        <Button 
                          onClick={handleResolve}
                          disabled={isUpdatingStatus}
                          className="h-8 px-4 rounded-lg bg-[#c65f39] hover:bg-[#b05432] text-white text-[9px] font-semibold transition-all active:scale-95 gap-1.5"
                        >
                           {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                           Resume AI
                        </Button>
                     )}
                     <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-black transition-colors"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                  </div>
               </div>

               {/* Escalation Banner */}
               {selectedSession.status === 'escalated' && (
                  <div className="bg-amber-50 border-b border-amber-100 px-4 md:px-6 py-2 flex items-center gap-2 shrink-0">
                     <AlertTriangle className="h-3 w-3 text-amber-600" />
                     <p className="text-[9px] font-semibold text-amber-700 tracking-tight">Manual response required</p>
                  </div>
               )}

               <ScrollArea className="flex-1 bg-white min-h-0">
                  <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 md:px-6">
                     {messages.map((m) => (
                       <div key={m.id} className={cn("flex flex-col gap-1.5", m.role === 'customer' ? "items-start" : "items-end")}>
                           <div className={cn(
                             "px-4 py-2.5 rounded-xl text-sm font-normal leading-relaxed max-w-[88%]",
                             m.role === 'customer' 
                               ? "bg-[#F5F5F5] text-gray-900" 
                               : "bg-white border border-gray-100 text-gray-900 shadow-sm"
                           )}>
                              {m.metadata?.media_path ? (
                                <div className="flex flex-col gap-1.5">
                                  {(m.metadata.media_mime as string)?.startsWith('image') ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={m.metadata.media_path as string} alt="Image" className="max-w-full rounded-lg" />
                                  ) : (m.metadata.media_mime as string)?.startsWith('video') ? (
                                    <video src={m.metadata.media_path as string} controls className="max-w-full rounded-lg" />
                                  ) : (m.metadata.media_mime as string)?.startsWith('audio') ? (
                                    <audio src={m.metadata.media_path as string} controls className="w-full" />
                                  ) : (
                                    <a href={m.metadata.media_path as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View file</a>
                                  )}
                                  {m.content && !m.content.startsWith('[') && <span>{m.content}</span>}
                                </div>
                              ) : (
                                m.content
                              )}
                           </div>
                          
                           <div className="flex items-center gap-2 px-1 text-gray-500 font-semibold">
                              <span className="text-[8px]">{m.role === 'customer' ? 'Customer' : 'Assistant'}</span>
                              {m.role !== 'customer' && m.agent_type && m.agent_type !== 'customer_support' && (
                                <span className="text-[7px] uppercase tracking-wider text-[#c65f39] font-bold">{formatAgentType(m.agent_type)}</span>
                              )}
                           </div>
                       </div>
                     ))}

                     {/* AI Typing Indicator */}
                     {selectedSession.status === 'active' && selectedSession.typing_status && selectedSession.typing_status !== 'idle' && (
                        <motion.div 
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex flex-col gap-2 items-end"
                        >
                           <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex items-center gap-2">
                              <div className="flex gap-1">
                                 <div className="h-1 w-1 bg-[#c65f39] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                 <div className="h-1 w-1 bg-[#c65f39] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                 <div className="h-1 w-1 bg-[#c65f39] rounded-full animate-bounce" />
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 capitalize">
                                 {selectedSession.typing_status.replace(/_/g, ' ')}...
                              </span>
                           </div>
                        </motion.div>
                     )}
                     <div ref={scrollRef} />
                  </div>
               </ScrollArea>

               {/* Reply Box */}
               <div className="p-4 md:p-5 bg-white border-t border-gray-50 shrink-0">
                  <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
                     <div className="relative flex-1">
                        <Input 
                          placeholder={selectedSession.status === 'escalated' ? "Type a message..." : "Assistant is active..."} 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          disabled={selectedSession.status !== 'escalated' || isSending}
                          className="h-10 pl-4 pr-10 bg-gray-50 border-gray-100 rounded-lg focus:bg-white focus:border-gray-200 transition-all text-xs font-normal disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500 text-gray-900"
                        />
                     </div>
                     <Button 
                        type="submit" 
                        disabled={selectedSession.status !== 'escalated' || isSending || !inputText.trim()}
                        className="h-10 px-4 rounded-lg bg-black text-white hover:bg-gray-800 flex items-center justify-center shrink-0 active:scale-95 transition-all gap-1.5"
                     >
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><span className="text-[10px] font-semibold hidden sm:inline">Send</span><Send className="h-3.5 w-3.5" /></>}
                     </Button>
                  </form>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4 text-gray-900">
                <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                   <Inbox className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                   <h2 className="text-base font-semibold tracking-tight">Select a conversation</h2>
                   <p className="text-xs text-gray-500 font-normal max-w-xs mx-auto">Choose a message from the list to begin.</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Compose Message Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="bg-white rounded-[2rem] sm:max-w-md p-8 border-gray-100 shadow-2xl overflow-hidden font-sans text-gray-900">
          <DialogHeader className="space-y-3 pb-6 border-b border-gray-50">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-left">New Message</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 font-medium text-left">Send a manual WhatsApp message to any contact.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-semibold ml-1 text-gray-600">Select Contact</Label>
                <div className="relative group text-gray-900">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-black transition-colors" />
                    <Input 
                        placeholder="Search contacts..." 
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="h-12 pl-10 pr-4 bg-gray-50 border-gray-100 rounded-xl text-sm focus:bg-white transition-all text-gray-900"
                    />
                </div>
                
                <ScrollArea className="h-48 border border-gray-100 rounded-xl bg-gray-50/30 mt-2">
                    <div className="p-2 space-y-1">
                        {filteredContacts.length === 0 ? (
                            <p className="text-center py-10 text-[10px] font-semibold text-gray-400">No contacts found</p>
                        ) : (
                            filteredContacts.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setSelectedContact(c)}
                                    className={cn(
                                        "w-full p-3 rounded-lg flex items-center gap-3 transition-all",
                                        selectedContact?.id === c.id ? "bg-black text-white shadow-md" : "hover:bg-gray-100 text-gray-700"
                                    )}
                                >
                                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold", selectedContact?.id === c.id ? "bg-white/20" : "bg-white border border-gray-200")}>
                                        {c.name?.charAt(0) || "U"}
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-xs font-semibold truncate w-full text-left">{c.name || "Unknown"}</span>
                                        <span className={cn("text-[9px] font-medium opacity-60 text-left w-full", selectedContact?.id === c.id ? "text-white" : "text-gray-600")}>{c.phone}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
             </div>

             <div className="space-y-2 text-left">
                <Label className="text-[10px] font-semibold ml-1 text-gray-600">Message</Label>
                <Textarea 
                    placeholder="Type your message here..."
                    value={composeMessage}
                    onChange={(e) => setManualComposeMessage(e.target.value)}
                    className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-sm resize-none p-4 font-medium text-gray-900"
                />
             </div>

             <Button 
                onClick={handleComposeSend}
                disabled={!selectedContact || !composeMessage.trim() || isSending}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold text-xs shadow-lg active:scale-95 transition-all gap-2"
             >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Send Message</>}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Template Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsComposeSettingsOpen}>
        <DialogContent className="bg-white rounded-[2rem] sm:max-w-md p-8 border-gray-100 shadow-2xl overflow-hidden font-sans text-gray-900">
            <DialogHeader className="space-y-3 pb-6 border-b border-gray-50 text-left">
                <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                    </div>
                    Greeting Template
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 font-medium">Set an automated message for new customers.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
                <div className="space-y-3 text-left">
                    <Label className="text-[10px] font-semibold ml-1 text-gray-600">Message Content</Label>
                    <Textarea 
                        placeholder="Hi! Thanks for reaching out. How can we help?"
                        value={welcomeTemplate}
                        onChange={(e) => setWelcomeTemplate(e.target.value)}
                        className="min-h-[160px] rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-sm resize-none p-4 font-medium leading-relaxed text-gray-900"
                    />
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                            This message is sent automatically to customers when they first message your account.
                        </p>
                    </div>
                </div>

                <Button 
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold text-xs shadow-lg active:scale-95 transition-all gap-2"
                >
                    {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Template"}
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
