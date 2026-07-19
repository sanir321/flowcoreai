import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { InsightsClient } from "@/components/insights/insights-client"
import { redirect } from "next/navigation"
import { getUserWorkspaceId } from "@/lib/workspace-auth"

export const metadata: Metadata = { title: "Insights" }

export default async function InsightsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspaceId = await getUserWorkspaceId(supabase, user.id)
  if (!workspaceId) redirect("/onboarding")

  const now = new Date()
  const buildRange = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const buildPrevRange = (days: number) => new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000).toISOString()

  const ranges = [7, 30, 90] as const
  type Range = typeof ranges[number]
  type RangeData = {
    metrics: {
      messages: number; messageChange: number
      contacts: number; contactChange: number
      sessions: number; sessionChange: number
      autonomyRate: number; escalations: number
      agents: number; kbSize: number
      whatsappStatus: string; googleCalendar: boolean; googleSheets: boolean
    }
    chartData: { date: string; inbound: number; outbound: number; total: number }[]
  }
  const allData: Record<Range, RangeData> = {} as Record<Range, RangeData>

  for (const days of ranges) {
    const rangeStart = buildRange(days)
    const prevRangeStart = buildPrevRange(days)
    const prevRangeEnd = rangeStart

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
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", rangeStart),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", prevRangeStart).lt("created_at", prevRangeEnd),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", rangeStart),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", prevRangeStart).lt("created_at", prevRangeEnd),
      supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", rangeStart),
      supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("created_at", prevRangeStart).lt("created_at", prevRangeEnd),
      supabase.from("escalation_logs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "open").is("deleted_at", null),
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

    const dateLabels = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      return d.toISOString().split('T')[0]
    })

    const { data: messageLogs } = await supabase
      .from("messages")
      .select("created_at, direction")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .gte("created_at", `${dateLabels[0] ?? ''}T00:00:00Z`)
      .order("created_at", { ascending: true })

    const dailyInbound: Record<string, number> = {}
    const dailyOutbound: Record<string, number> = {}
    messageLogs?.forEach((m) => {
      if (m.created_at) {
        const date = m.created_at.split('T')[0] as string
        if (m.direction === 'inbound') dailyInbound[date] = (dailyInbound[date] || 0) + 1
        else dailyOutbound[date] = (dailyOutbound[date] || 0) + 1
      }
    })

    const chartData = dateLabels.map((day) => {
      const d = day as string
      return {
        date: days <= 7
          ? new Date(d + "T12:00:00Z").toLocaleDateString('en-US', { weekday: 'short' })
          : new Date(d + "T12:00:00Z").toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inbound: dailyInbound[d] || 0,
        outbound: dailyOutbound[d] || 0,
        total: (dailyInbound[d] || 0) + (dailyOutbound[d] || 0),
      }
    })

    allData[days] = {
      metrics: {
        messages: totalMsgs, messageChange: msgChange,
        contacts: totalContacts, contactChange: contactChange,
        sessions: totalSessions, sessionChange: sessionChange,
        autonomyRate: totalMsgs > 0 ? Math.round((1 - (totalEscalations / totalMsgs)) * 100) : 0,
        escalations: totalEscalations,
        agents: agentCount.count || 0,
        kbSize: kbCount.count || 0,
        whatsappStatus: gowaStatus.data?.status || 'disconnected',
        googleCalendar: !!googleConfig.data?.calendar_id,
        googleSheets: !!googleConfig.data?.sheet_id,
      },
      chartData,
    }
  }

  return <InsightsClient allData={allData} />
}
