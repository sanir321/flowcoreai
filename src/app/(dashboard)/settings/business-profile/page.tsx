/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BusinessProfileClient } from "./business-profile-client"

export const metadata: Metadata = { title: "Business Profile" }

export default async function BusinessProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

  const { data: workspace } = await (supabase as any)
    .from("workspaces")
    .select("business_profile, business_type, name, services_offered")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .single()

  return (
    <BusinessProfileClient
      workspaceId={workspaceId}
      initialProfile={(workspace?.business_profile as any) || {}}
      businessType={workspace?.business_type || "hotel"}
      initialServicesOffered={workspace?.services_offered || ""}
      initialSuggestions={((workspace?.business_profile as any)?.suggestion) || null}
    />
  )
}
