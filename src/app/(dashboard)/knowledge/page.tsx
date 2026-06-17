/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KnowledgeHubClient } from "@/components/knowledge/knowledge-hub-client"

export const metadata: Metadata = { title: "Knowledge Hub" }

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

  const [{ data: sources }, { data: ws }] = await Promise.all([
    supabase
      .from("kb_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    (supabase as any)
      .from("workspaces")
      .select("business_type, business_profile, name, services_offered")
      .eq("id", workspaceId)
      .single(),
  ])

  const businessType = ws?.business_type || "hotel"
  const businessProfile = ws?.business_profile || {}
  const servicesOffered = ws?.services_offered || ""
  const suggestion = (businessProfile as any)?.suggestion || null

  const [{ data: wildcardTemplates }, { data: typeTemplates }] = await Promise.all([
    (supabase as any).from("required_info_templates").select("*").eq("business_type", "*").order("priority", { ascending: true }),
    (supabase as any).from("required_info_templates").select("*").eq("business_type", businessType).order("priority", { ascending: true }),
  ])
  const templates = [...(wildcardTemplates || []), ...(typeTemplates || [])]

  const usedTags = [...new Set(
    (sources || [])
      .filter(s => s.source_type === 'txt' && s.label !== "Pasted text")
      .map(s => s.label)
  )]

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
