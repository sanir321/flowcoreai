import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContactsClient } from "./contacts-client"

export const metadata: Metadata = { title: "Contacts" }

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) {
    const { data: w } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle()
    if (w) workspaceId = w.id
    else redirect("/onboarding")
  }

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .single()
  if (!ws) redirect("/onboarding")

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*, appointments(count)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("last_active", { ascending: false })
    .limit(10)

  return (
    <ContactsClient 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialContacts={(contacts as any[]) || []}
      workspaceId={workspaceId} 
    />
  )
}
