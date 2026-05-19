import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersClient } from "../../orders/orders-client"

export default async function SettingsOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) redirect("/onboarding")

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (
    <OrdersClient
      initialOrders={(orders as any[]) || []}
    />
  )
}
