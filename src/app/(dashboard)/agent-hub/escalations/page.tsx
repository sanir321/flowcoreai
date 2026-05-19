"use client"

import { useState, useEffect } from "react"
import { 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowUpRight,
  MoreHorizontal,
  ChevronRight,
  Filter,
  Search
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function EscalationsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function fetchLogs() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const workspaceId = user.app_metadata.workspace_id

      const { data } = await supabase
        .from("escalation_logs")
        .select(`
          *,
          conversation_sessions (
            id,
            contacts (name, phone)
          )
        `)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
      
      setLogs(data || [])
      setIsLoading(false)
    }
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => 
    log.trigger_type.toLowerCase().includes(search.toLowerCase()) ||
    log.conversation_sessions?.contacts?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">Escalation Insights</h1>
        <p className="text-sm text-gray-500">Monitor and review manual intervention triggers across your Agents.</p>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
                <Skeleton className="h-3 w-28" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            ))}
          </>
        ) : (
          logs.filter((_, i) => i < 3).length > 0 ? (
            [
              { label: "Active Escalations", val: logs.filter(l => l.status === 'pending').length, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Avg Resolution", val: "14m", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Critical Priority", val: logs.filter(l => l.priority === 'high').length, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                 <div className="flex items-center justify-between">
                    <h3 className={cn("text-3xl font-bold", stat.color)}>{stat.val}</h3>
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg)}>
                       <ShieldAlert className={cn("h-5 w-5", stat.color)} />
                    </div>
                 </div>
              </div>
            ))
          ) : null
        )}
      </div>

      {/* Filter Bar */}
      {isLoading ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-10 flex-1 w-full max-w-md rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by reason or contact..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-gray-200 rounded-lg text-sm"
            />
          </div>
          <Button variant="outline" className="h-10 px-4 gap-2 rounded-lg text-sm text-gray-600 border-gray-200">
             <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50 border-b border-gray-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-bold uppercase text-gray-500 py-4 pl-6">Trigger Event</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-500 py-4">Contact</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-500 py-4">Status</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-500 py-4">Priority</TableHead>
              <TableHead className="text-[11px] font-bold uppercase text-gray-500 py-4">Created</TableHead>
              <TableHead className="text-right pr-6 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-gray-400 text-sm font-medium">No escalation triggers found.</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-gray-50 hover:bg-gray-50/30 transition-colors group">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{log.trigger_type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-gray-400 font-medium">REF_{log.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <User className="h-3.5 w-3.5 text-gray-300" />
                       <span className="text-xs font-medium text-gray-700">{log.conversation_sessions?.contacts?.name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase px-2.5 h-6 border-none rounded-md",
                      log.status === 'resolved' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <span className={cn(
                       "text-[10px] font-bold uppercase",
                       log.priority === 'high' ? "text-rose-500" : "text-gray-400"
                     )}>{log.priority}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-gray-300 hover:text-gray-900 group-hover:bg-white transition-all">
                       <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
