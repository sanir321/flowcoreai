"use client"

import { useState, useMemo } from "react"
import { Building2, Database, CheckCircle2, FileText, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface OverviewTabProps {
  workspaceId: string
  businessProfile: any
  sources: any[]
  templates: any[]
  usedTags: string[]
  onNavigate: (tab: "profile" | "sources") => void
}

function hasNonEmptyValue(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some(v => {
    if (v == null || v === "") return false
    if (typeof v === "object" && !Array.isArray(v)) return hasNonEmptyValue(v as Record<string, unknown>)
    return true
  })
}

export function OverviewTab({ businessProfile, sources, templates, usedTags, onNavigate }: OverviewTabProps) {
  const usedTagsSet = useMemo(() => new Set(usedTags || []), [usedTags])
  const mergedProfile = useMemo(() => {
    const bp = businessProfile || {}
    return { ...(bp.suggestion || {}), ...bp }
  }, [businessProfile])

  const items = useMemo(() => {
    return (templates || []).map(t => {
      let status: "complete" | "empty" = "empty"
      const fkey = t.field_key

      if (t.section === "business_profile") {
        const extras = (mergedProfile?.extras || {}) as Record<string, unknown>
        let val: unknown = null
        if (fkey.startsWith("extras.")) val = extras[fkey.replace("extras.", "")]
        else val = mergedProfile?.[fkey]
        if (val != null) {
          if (Array.isArray(val)) status = val.length > 0 ? "complete" : "empty"
          else if (typeof val === "object") status = hasNonEmptyValue(val as Record<string, unknown>) ? "complete" : "empty"
          else if (typeof val === "string") status = val.trim().length > 0 ? "complete" : "empty"
          else status = "complete"
        }
      } else if (t.section === "knowledge_base") {
        status = usedTagsSet.has(fkey) ? "complete" : "empty"
      }

      return {
        id: t.id, label: t.label, section: t.section,
        field_key: t.field_key, status,
      }
    })
  }, [templates, mergedProfile, usedTagsSet])

  const completed = items.filter(i => i.status === "complete").length
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0
  const activeSources = sources.filter(s => s.status === "active").length
  const pendingSources = sources.filter(s => s.status === "pending" || s.status === "processing").length
  const totalChunks = sources.reduce((sum, s) => sum + (s.chunk_count || 0), 0)
  const profileItems = items.filter(i => i.section === "business_profile")
  const profileComplete = profileItems.filter(i => i.status === "complete").length
  const kbItems = items.filter(i => i.section === "knowledge_base")
  const kbComplete = kbItems.filter(i => i.status === "complete").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-[#c65f39]/10 flex items-center justify-center mb-4">
            <Building2 className="h-5 w-5 text-[#c65f39]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{profileComplete}/{profileItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">Profile fields filled</p>
          <button onClick={() => onNavigate("profile")} className="mt-3 text-xs font-medium text-[#c65f39] hover:text-[#b55533] flex items-center gap-1">
            Complete profile <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Database className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{kbComplete}/{kbItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">Knowledge topics covered</p>
          <button onClick={() => onNavigate("sources")} className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Add sources <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalChunks}</p>
          <p className="text-xs text-gray-500 mt-1">Knowledge chunks indexed</p>
          <p className="mt-3 text-xs text-gray-400">
            {activeSources} active sources{pendingSources > 0 ? `, ${pendingSources} processing` : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Setup Progress</h2>
          <span className="text-xs font-bold text-gray-500">{progress}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full bg-gradient-to-r from-[#c65f39] to-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-1.5">
              <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                item.status === "complete" ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                {item.status === "complete" && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p className={cn("text-xs font-medium", item.status === "complete" ? "text-gray-500" : "text-gray-900")}>{item.label}</p>
                <p className="text-[10px] text-gray-400 capitalize">{item.section === "business_profile" ? "Profile" : "Knowledge Base"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#c65f39]/5 to-emerald-50 rounded-[2rem] border border-[#c65f39]/10 p-8">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#c65f39]/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-[#c65f39]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Agents use this information</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-lg">
              Your business profile and knowledge base feed directly into your AI agents.
              The more complete your setup, the better your agents can answer customer questions,
              book appointments, and handle support tickets.
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => onNavigate("profile")}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#c65f39] text-white hover:bg-[#b55533] transition-all">
                Edit Profile
              </button>
              <button onClick={() => onNavigate("sources")}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all">
                Manage Sources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
