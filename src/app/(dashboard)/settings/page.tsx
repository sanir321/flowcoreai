/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export const metadata: Metadata = { title: "Settings" }

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle()
    if (ws) workspaceId = ws.id
    else redirect("/onboarding")
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (!workspace) redirect("/onboarding")

  return (
    <SettingsClient initialWorkspace={workspace as any} />
  )
}
