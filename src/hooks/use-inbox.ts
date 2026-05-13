import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendManualReply } from "@/app/actions/inbox"
import { toast } from "sonner"

export function useInbox(workspaceId?: string) {
  const [sessions, setSessions] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient() as any
  const subscriptionRef = useRef<any>(null)

  // Fetch sessions
  useEffect(() => {
    if (!workspaceId || workspaceId === "placeholder-id") return

    async function fetchSessions() {
      const { data, error } = await supabase
        .from("conversation_sessions")
        .select(`
          *,
          contacts (*)
        `)
        .eq("workspace_id", workspaceId)
        .order("last_message_at", { ascending: false })

      if (error) {
        console.error(error)
        toast.error("Failed to load conversations")
      } else {
        setSessions(data || [])
      }
    }

    fetchSessions()

    // Optimized Subscribe: Ensure we don't duplicate subscriptions
    if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
    }

    const channel = supabase
      .channel(`sessions-${workspaceId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "conversation_sessions", 
          filter: `workspace_id=eq.${workspaceId}` 
        },
        (payload: any) => {
          setSessions(prev => [payload.new, ...prev])
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "conversation_sessions", 
          filter: `workspace_id=eq.${workspaceId}` 
        },
        (payload: any) => {
          setSessions(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s))
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "DELETE", 
          schema: "public", 
          table: "conversation_sessions", 
          filter: `workspace_id=eq.${workspaceId}` 
        },
        (payload: any) => {
          setSessions(prev => prev.filter(s => s.id !== payload.old.id))
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [workspaceId])

  const fetchMessages = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      toast.error("Failed to load messages")
    } else {
      setMessages(data || [])
    }
    setIsLoading(false)
  }, [supabase])

  const sendMessage = useCallback(async (sessionId: string, content: string) => {
    const result = await sendManualReply({ session_id: sessionId, content })
    if (result.error) {
      toast.error(result.error)
      return false
    }
    return true
  }, [])

  const updateSessionStatus = useCallback(async (sessionId: string, status: string) => {
    const { error } = await supabase
      .from("conversation_sessions")
      .update({ status })
      .eq("id", sessionId)

    if (error) {
      toast.error(`Failed to update status to ${status}`)
      return false
    }
    
    toast.success(`Session ${status}`)
    return true
  }, [supabase])

  return {
    sessions,
    messages,
    isLoading,
    fetchMessages,
    sendMessage,
    updateSessionStatus,
    setMessages
  }
}
