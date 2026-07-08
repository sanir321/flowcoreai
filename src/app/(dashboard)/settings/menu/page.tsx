/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MenuClient } from "./menu-client"

export default async function MenuSettingsPage() {
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

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("category")
    .order("name")

  return <MenuClient initialItems={(items as any[]) || []} />
}
