import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InboxClient } from "./inbox-client"

export const metadata: Metadata = { title: "Inbox" }

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, welcome_template")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .single()

  if (!workspace) redirect("/onboarding")

  // Fetch initial sessions
  const { data: sessions } = await supabase
    .from("conversation_sessions")
    .select("*, contacts(*)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })

  // Fetch initial contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .limit(50)

  return (
    <InboxClient 
      initialSessions={(sessions as any[]) || []} 
      initialContacts={(contacts as any[]) || []} 
      initialWelcomeTemplate={workspace?.welcome_template || ""}
      workspaceId={workspaceId} 
    />
  )
}
