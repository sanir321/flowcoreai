import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KnowledgeClient } from "@/components/knowledge/knowledge-client"

export const metadata: Metadata = { title: "Knowledge Base" }

export default async function KnowledgePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) {
    const { data: workspace } = await (supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle() as any)
    if (workspace) {
      workspaceId = workspace.id
    } else {
      redirect("/onboarding")
    }
  }

  const { data: sources } = await supabase
    .from("kb_sources")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return <KnowledgeClient initialSources={(sources || []) as any} workspaceId={workspaceId} />
}
