import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersClient } from "./orders-client"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export const metadata: Metadata = { title: "Orders" }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getUserWorkspaceId(supabase, user.id)
  if (!workspaceId) redirect("/onboarding")

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .single()
  if (!ws) redirect("/onboarding")

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (
    <OrdersClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialOrders={(orders as any[]) || []}
    />
  )
}
