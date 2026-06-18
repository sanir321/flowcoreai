"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShieldAlert, User, Search, Filter, X, CheckCircle, Clock,
  AlertTriangle, MessageSquare, ChevronDown, ExternalLink, RefreshCw, PanelRightClose, PanelRight
} from "lucide-react"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Json } from "@/types/supabase"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"

type EscalationLog = {
  id: string
  workspace_id: string
  session_id: string
  trigger_type: string
  trigger_message: string | null
  conversation_snapshot: Json
  status: string
  resolved_by: string | null
  resolved_at: string | null
  notes: string | null
  notification_sent: boolean
  created_at: string
  updated_at: string
  conversation_sessions: {
    id: string
    contacts: { name: string | null; phone: string | null } | null
  } | null
}

type FilterState = {
  search: string
  status: string
}

const TRIGGER_ICONS: Record<string, typeof ShieldAlert> = {
  keyword: AlertTriangle,
  sentiment: MessageSquare,
  manual: User,
  greeting: MessageSquare,
}

const TRIGGER_COLORS: Record<string, string> = {
  keyword: "text-red-600 bg-red-50 border-red-100",
  sentiment: "text-amber-600 bg-amber-50 border-amber-100",
  manual: "text-blue-600 bg-blue-50 border-blue-100",
  greeting: "text-purple-600 bg-purple-50 border-purple-100",
}

function pluralize(n: number, s: string) {
  return `${n} ${s}${n !== 1 ? "s" : ""}`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return pluralize(mins, "min")
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return pluralize(hrs, "hr")
  const days = Math.floor(hrs / 24)
  return pluralize(days, "day")
}

export default function EscalationsPage() {
  const [logs, setLogs] = useState<EscalationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({ search: "", status: "all" })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let workspaceId = user.app_metadata?.workspace_id as string | undefined
      if (!workspaceId) {
        const { data: ws } = await supabase.from("workspaces").select("id").eq("owner_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).single()
        workspaceId = ws?.id
      }
      if (!workspaceId) return

      const { data, error: fetchError } = await supabase
        .from("escalation_logs")
        .select(`*, conversation_sessions (id, contacts (name, phone))`)
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setLogs(data || [])
    } catch {
      setError("Failed to load escalations")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleResolve = async (log: EscalationLog) => {
    setResolving(log.id)
    await supabase
      .from("escalation_logs")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", log.id)
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, status: "resolved", resolved_at: new Date().toISOString() } : l))
    setResolving(null)
  }

  const filteredLogs = logs.filter(log => {
    if (filters.status !== "all" && log.status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const contact = log.conversation_sessions?.contacts
      const name = contact?.name?.toLowerCase() || ""
      const phone = contact?.phone?.toLowerCase() || ""
      const msg = log.trigger_message?.toLowerCase() || ""
      const type = log.trigger_type.toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !msg.includes(q) && !type.includes(q)) return false
    }
    return true
  })

  const pending = logs.filter(l => l.status === "pending").length
  const resolved = logs.filter(l => l.status === "resolved").length
  const avgResolutionMs = logs
    .filter(l => l.status === "resolved" && l.resolved_at)
    .reduce((acc, l) => acc + (new Date(l.resolved_at!).getTime() - new Date(l.created_at).getTime()), 0)
  const avgResolutionMins = logs.filter(l => l.status === "resolved" && l.resolved_at).length
    ? Math.round(avgResolutionMs / 60000 / logs.filter(l => l.status === "resolved" && l.resolved_at).length)
    : null

  return (
    <div className="flex min-h-0 flex-1 bg-gray-50/30 font-sans">
      <AssistantsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-8 border-b border-gray-100 bg-white shrink-0" style={{ height: 52 }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white shadow-sm">
            <ShieldAlert size={15} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Escalations</h1>
            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Human Intervention</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> Refresh
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="max-w-[1400px] space-y-6">

      {error && (
        <Card className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-10" />
                </div>
              ))
            ) : (
              <>
                {[
                  { label: "Total", val: logs.length, color: "text-gray-900", icon: ShieldAlert },
                  { label: "Pending", val: pending, color: "text-rose-600", icon: Clock },
                  { label: "Resolved", val: resolved, color: "text-emerald-600", icon: CheckCircle },
                  { label: "Avg Resolution", val: avgResolutionMins ? `${avgResolutionMins}m` : "—", color: "text-blue-600", icon: Clock },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-2xl font-bold", stat.color)}>{stat.val}</h3>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by contact, trigger, or message..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 h-10 border-gray-200 rounded-lg text-sm"
              />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="w-36 h-10 border-gray-200 rounded-lg text-sm">
                <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            {(filters.search || filters.status !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ search: "", status: "all" })} className="h-10 gap-1 text-xs">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card className="p-12 text-center">
              <ShieldAlert className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {logs.length === 0 ? "No escalations yet" : "No escalations match your filters"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = TRIGGER_ICONS[log.trigger_type] || ShieldAlert
                const isExpanded = expandedId === log.id
                const contact = log.conversation_sessions?.contacts
                const snapshot = log.conversation_snapshot as Record<string, unknown> | null

                return (
                  <div key={log.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-lg border flex items-center justify-center shrink-0",
                          TRIGGER_COLORS[log.trigger_type] || "text-gray-600 bg-gray-50 border-gray-200"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 capitalize">
                                {log.trigger_type.replace(/_/g, " ")}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {contact?.name || "Unknown"} {contact?.phone ? `· ${contact.phone}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {log.status === "pending" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolve(log)}
                                  disabled={resolving === log.id}
                                  className="h-7 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <CheckCircle className={cn("h-3 w-3", resolving === log.id && "animate-spin")} />
                                  Resolve
                                </Button>
                              ) : (
                                <Badge className="text-[10px] font-bold uppercase px-2.5 h-6 border-none rounded-md bg-emerald-50 text-emerald-700">
                                  Resolved
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                className="h-7 w-7 p-0 text-gray-400"
                              >
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                              </Button>
                            </div>
                          </div>

                          {log.trigger_message && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{log.trigger_message}</p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold uppercase px-2.5 h-6 rounded-md",
                              log.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {log.status}
                            </Badge>
                            <span className="text-[11px] text-gray-400">{timeAgo(log.created_at)}</span>
                            {log.resolved_at && (
                              <span className="text-[11px] text-gray-400">· resolved {timeAgo(log.resolved_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Conversation Snapshot
                        </div>
                        {snapshot && Array.isArray(snapshot.messages) ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(snapshot.messages as Array<{ role?: string; content?: string }>).slice(-6).map((msg, i) => (
                              <div key={i} className={cn(
                                "p-3 rounded-lg text-xs leading-relaxed",
                                msg.role === "assistant"
                                  ? "bg-white border border-gray-100 ml-6"
                                  : "bg-[#c65f39]/5 border border-[#c65f39]/10 mr-6"
                              )}>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider block mb-0.5",
                                  msg.role === "assistant" ? "text-gray-400" : "text-[#c65f39]"
                                )}>
                                  {msg.role || "user"}
                                </span>
                                {msg.content}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No conversation data available</p>
                        )}
                        {log.notes && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-xs text-gray-600">{log.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
      </div>
      </div>
      </div>
    </div>
  )
}
