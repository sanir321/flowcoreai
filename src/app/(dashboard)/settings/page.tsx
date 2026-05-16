import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

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
