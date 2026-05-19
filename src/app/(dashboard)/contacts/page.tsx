import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContactsClient } from "./contacts-client"

export const metadata: Metadata = { title: "Contacts" }

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*, appointments(count)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("last_active", { ascending: false })

  return (
    <ContactsClient 
      initialContacts={(contacts as any[]) || []} 
      workspaceId={workspaceId} 
    />
  )
}
