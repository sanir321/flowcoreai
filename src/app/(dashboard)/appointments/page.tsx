import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentsClient } from "@/components/appointments/appointments-client"

export const metadata: Metadata = { title: "Appointments" }

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

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
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppointmentsClient 
          initialAppointments={appointments || []} 
          workspaceId={workspaceId} 
          isModuleActive={isModuleActive}
        />
      </div>
    </div>
  )
}
