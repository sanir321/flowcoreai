/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export const metadata: Metadata = { title: "Settings" }

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getUserWorkspaceId(supabase, user.id)
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
