/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KnowledgeHubClient } from "@/components/knowledge/knowledge-hub-client"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export const metadata: Metadata = { title: "Knowledge Hub" }

export default async function KnowledgePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getUserWorkspaceId(supabase, user.id)
  if (!workspaceId) redirect("/onboarding")

  const [{ data: sources }, { data: ws }] = await Promise.all([
    supabase
      .from("kb_sources")
      .select("id, label, source_type, status, chunk_count, created_at, error_message")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    (supabase as any)
      .from("workspaces")
      .select("business_type, business_profile, name, services_offered")
      .eq("id", workspaceId)
      .single(),
  ])

  const businessType = ws?.business_type || "general"
  const businessProfile = ws?.business_profile || {}
  const servicesOffered = ws?.services_offered || ""
  const suggestion = (businessProfile as any)?.suggestion || null

  const [{ data: wildcardTemplates }, { data: typeTemplates }, { data: tags }] = await Promise.all([
    (supabase as any).from("required_info_templates").select("*").eq("business_type", "*").order("priority", { ascending: true }),
    (supabase as any).from("required_info_templates").select("*").eq("business_type", businessType).order("priority", { ascending: true }),
    (supabase as any).rpc("get_distinct_kb_tags", { p_workspace_id: workspaceId }),
  ])
  const templates = [...(wildcardTemplates || []), ...(typeTemplates || [])]
  const usedTags = (tags as string[]) || []

  return (
    <KnowledgeHubClient
      workspaceId={workspaceId}
      initialBusinessProfile={businessProfile}
      businessType={businessType}
      initialServicesOffered={servicesOffered}
      initialSuggestions={suggestion}
      initialSources={(sources || []) as any}
      initialTemplates={templates || []}
      initialUsedTags={usedTags}
    />
  )
}
