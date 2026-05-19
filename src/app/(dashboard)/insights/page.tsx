import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { InsightsClient } from "@/components/insights/insights-client"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Insights" }

export default async function InsightsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  let workspaceId = user.app_metadata?.workspace_id
  if (!workspaceId) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle()

    if (ws) workspaceId = ws.id
    else redirect("/onboarding")
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [
    curMsgs, prevMsgs,
    curContacts, prevContacts,
    curSessions, prevSessions,
    curEscalations,
    gowaStatus,
    googleConfig,
    kbCount,
    agentCount,
  ] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", sevenDaysAgo),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", sevenDaysAgo),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
    supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", sevenDaysAgo),
    supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
    supabase.from("escalation_logs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "pending").is("deleted_at", null),
    supabase.from("gowa_sessions").select("status").eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle(),
    supabase.from("google_oauth_tokens").select("calendar_id, sheet_id").eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle(),
    supabase.from("kb_chunks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null),
    supabase.from("workspace_agents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active").is("deleted_at", null),
  ])

  const totalMsgs = curMsgs.count || 0
  const totalContacts = curContacts.count || 0
  const totalSessions = curSessions.count || 0
  const totalEscalations = curEscalations.count || 0

  const msgChange = prevMsgs.count ? Math.round(((totalMsgs - prevMsgs.count) / prevMsgs.count) * 100) : 0
  const contactChange = prevContacts.count ? Math.round(((totalContacts - prevContacts.count) / prevContacts.count) * 100) : 0
  const sessionChange = prevSessions.count ? Math.round(((totalSessions - prevSessions.count) / prevSessions.count) * 100) : 0
  const autonomyRate = totalMsgs > 0 ? Math.round((1 - (totalEscalations / totalMsgs)) * 100) : 0

  const metrics = {
    messages: totalMsgs,
    messageChange: msgChange,
    contacts: totalContacts,
    contactChange: contactChange,
    sessions: totalSessions,
    sessionChange: sessionChange,
    autonomyRate,
    escalations: totalEscalations,
    agents: agentCount.count || 0,
    kbSize: kbCount.count || 0,
    whatsappStatus: gowaStatus.data?.status || 'disconnected',
    googleCalendar: !!googleConfig.data?.calendar_id,
    googleSheets: !!googleConfig.data?.sheet_id,
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const { data: messageLogs } = await supabase
    .from("messages")
    .select("created_at, direction")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .gte("created_at", `${last7Days[0] ?? ''}T00:00:00Z`)
    .order("created_at", { ascending: true })

  const dailyInbound: Record<string, number> = {}
  const dailyOutbound: Record<string, number> = {}
  messageLogs?.forEach((m) => {
    if (m.created_at) {
      const date = m.created_at.split('T')[0] as string
      if (m.direction === 'inbound') {
        dailyInbound[date] = (dailyInbound[date] || 0) + 1
      } else {
        dailyOutbound[date] = (dailyOutbound[date] || 0) + 1
      }
    }
  })

  const chartData = last7Days.map((day) => ({
    date: new Date(day + "T12:00:00Z").toLocaleDateString('en-US', { weekday: 'short' }),
    inbound: dailyInbound[day as string] || 0,
    outbound: dailyOutbound[day as string] || 0,
    total: (dailyInbound[day as string] || 0) + (dailyOutbound[day as string] || 0),
  }))

  return (
    <InsightsClient metrics={metrics} chartData={chartData} />
  )
}
