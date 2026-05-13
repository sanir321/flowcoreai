"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppointmentsClient } from "@/components/appointments/appointments-client"
import { AppointmentsSidebar } from "@/components/appointments/appointments-sidebar"
import { Loader2 } from "lucide-react"

const supabase = createClient()

export default function AppointmentsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  const [appointments, setAppointments] = useState<any[]>([])
  const [isModuleActive, setIsModuleActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const id = user.app_metadata?.workspace_id
      if (!id) return
      setWorkspaceId(id)

      const { data: agent } = await supabase
        .from("workspace_agents")
        .select("id, status")
        .eq("workspace_id", id)
        .eq("agent_type", "appointment_booking")
        .single()

      setIsModuleActive(agent?.status === "active")
      setIsLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!workspaceId) return;

    // Listen for new appointments in real-time
    const channel = supabase
      .channel(`appointments:${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments((prev) => [...prev, payload.new])
          }
          if (payload.eventType === 'UPDATE') {
            setAppointments((prev) => prev.map(a => a.id === payload.new.id ? payload.new : a))
          }
          if (payload.eventType === 'DELETE') {
            setAppointments((prev) => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
       <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      <AppointmentsSidebar currentView={view} onViewChange={setView} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-gray-50">
        <AppointmentsClient 
          initialAppointments={appointments} 
          workspaceId={workspaceId!} 
          view={view}
          isModuleActive={isModuleActive}
        />
      </div>
    </div>
  )
}
