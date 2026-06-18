import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BusinessProfileClient } from "./business-profile-client"

export const metadata: Metadata = { title: "Business Profile" }

export default async function BusinessProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id as string | undefined
  if (!workspaceId) redirect("/onboarding")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ws } = await (supabase as any)
    .from("workspaces")
    .select("business_profile, business_type, services_offered")
    .eq("id", workspaceId)
    .single()
  const workspace = ws as Record<string, unknown> | null

  const businessType = (workspace?.business_type as string) || "other"
  const initialProfile = (workspace?.business_profile as Record<string, unknown>) || {}
  const initialServicesOffered = (workspace?.services_offered as string) || ""
  const initialSuggestions = (initialProfile?.suggestion as Record<string, unknown>) || null

  return (
    <BusinessProfileClient
      workspaceId={workspaceId}
      initialProfile={initialProfile as any}
      businessType={businessType}
      initialServicesOffered={initialServicesOffered}
      initialSuggestions={initialSuggestions}
    />
  )
}
