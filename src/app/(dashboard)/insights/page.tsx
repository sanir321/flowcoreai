import { createClient } from "@/lib/supabase/server"
import { InsightsClient } from "@/components/insights/insights-client"
import { redirect } from "next/navigation"

export default async function InsightsPage() {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 2. Identify Workspace
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

  // 3. Fetch Aggregate Metrics & Telemetry
  const [msgCount, contactCount, totalSessions, healthRes, performanceRes] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("conversation_sessions").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    // System Health from Traces
    (supabase.rpc as any)('get_workspace_health', { ws_id: workspaceId }),
    // AI Performance from View
    (supabase.from as any)("ai_performance_report").select("*").eq("workspace_id", workspaceId).maybeSingle()
  ])

  // 4. Calculate Health & Performance Metrics
  // Fallback for RPC if not created, using manual query
  let health = { avg_latency: 0, fallback_rate: 0, block_rate: 0, total_traces: 0 };
  
  const { data: traceStats } = await (supabase.rpc as any)('get_workspace_health', { ws_id: workspaceId }).single();
  if (traceStats) {
      health = traceStats;
  } else {
      // Manual calculation if RPC fails
      const { data: traces } = await (supabase.from as any)('agent_traces').select('latency_ms, fallback_used, guardrail_blocked').eq('workspace_id', workspaceId).limit(100);
      if (traces && traces.length > 0) {
          health.total_traces = traces.length;
          health.avg_latency = Math.round((traces as any[]).reduce((acc: number, t: any) => acc + (t.latency_ms || 0), 0) / traces.length);
          health.fallback_rate = Math.round(((traces as any[]).filter((t: any) => t.fallback_used).length / traces.length) * 100);
          health.block_rate = Math.round(((traces as any[]).filter((t: any) => t.guardrail_blocked).length / traces.length) * 100);
      }
  }

  const aiResolutionRate = (performanceRes.data as any)?.ai_resolution_rate_pct || 0;

  const metrics = {
    messages: msgCount.count || 0,
    escalations: totalSessions.count ? totalSessions.count - ((performanceRes.data as any)?.ai_resolutions || 0) : 0,
    contacts: contactCount.count || 0,
    conversion_rate: aiResolutionRate
  }

  // 5. Fetch Chart Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const { data: messageLogs } = await supabase
    .from("messages")
    .select("created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", `${last7Days[0]}T00:00:00Z`)
    .order("created_at", { ascending: true })

  const dailyCounts: Record<string, number> = {};
  messageLogs?.forEach((m) => {
    if (m.created_at) {
        const date = m.created_at.split('T')[0] as string;
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
  })

  const chartData = (last7Days as string[]).map((day) => ({
    date: new Date(day + "T12:00:00Z").toLocaleDateString('en-US', { weekday: 'short' }),
    count: dailyCounts[day] || 0
  }))

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Insights</h1>
        <p className="text-sm text-gray-500 font-medium">Real-time performance metrics and traffic analysis.</p>
      </div>
      
      <InsightsClient metrics={metrics} health={health} chartData={chartData} />
    </div>
  )
}
