import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { AgentHubClient, type Agent } from "./agent-hub-client"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Agent Hub" }

export default async function AgentHubPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) {
    redirect("/onboarding")
  }

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .single()
  if (!ws) redirect("/onboarding")

  const { data: agents } = await supabase
    .from("workspace_agents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (
    <AgentHubClient 
      initialAgents={(agents || []) as Agent[]} 
      workspaceId={workspaceId} 
    />
  )
}
