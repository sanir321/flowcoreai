/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MenuClient } from "./menu-client"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export default async function MenuSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getUserWorkspaceId(supabase, user.id)
  if (!workspaceId) redirect("/onboarding")

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("category")
    .order("name")

  return <MenuClient initialItems={(items as any[]) || []} />
}
