import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentsClient } from "@/components/appointments/appointments-client"
import { AppointmentsSidebar } from "@/components/appointments/appointments-sidebar"

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

  const view = (await searchParams).view === 'list' ? 'list' : 'calendar'

  // Fetch initial appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("start_at", { ascending: true })

  // Check if module is active
  const { data: agent } = await supabase
    .from("workspace_agents")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("agent_type", "appointment_booking")
    .single()

  const isModuleActive = agent?.status === "active"

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      <AppointmentsSidebar currentView={view} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-gray-50">
        <AppointmentsClient 
          initialAppointments={appointments || []} 
          workspaceId={workspaceId} 
          view={view}
          isModuleActive={isModuleActive}
        />
      </div>
    </div>
  )
}
