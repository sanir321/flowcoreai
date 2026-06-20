"use client"

import { useMemo } from "react"
import { Building2, Database, CheckCircle2, FileText, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface KbTemplate {
  id: string
  label: string
  section: string
  field_key: string
}
interface KbSource {
  status: string
  chunk_count?: number
}

interface OverviewTabProps {
  businessProfile: Record<string, unknown>
  sources: KbSource[]
  templates: KbTemplate[]
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

function resolveNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: any, key) => (acc != null ? acc[key] : undefined), obj)
}

export function OverviewTab({ businessProfile, sources, templates, usedTags, onNavigate }: OverviewTabProps) {
  const usedTagsSet = useMemo(() => new Set(usedTags || []), [usedTags])
  const mergedProfile = useMemo(() => {
    const bp = businessProfile || {}
    const suggestion = bp.suggestion as Record<string, unknown> | undefined
    return { ...suggestion, ...bp } as Record<string, unknown>
  }, [businessProfile])

  const items = useMemo(() => {
    return (templates || []).map(t => {
      let status: "complete" | "empty" = "empty"
      const fkey = t.field_key

      if (t.section === "business_profile") {
        let val: unknown = null
        if (fkey.startsWith("extras.")) {
          const extras = (mergedProfile?.extras || {}) as Record<string, unknown>
          val = extras[fkey.replace("extras.", "")]
        } else {
          val = resolveNestedValue(mergedProfile, fkey)
        }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold text-gray-900">{profileComplete}/{profileItems.length}</p>
            <div className="h-8 w-8 rounded-lg bg-[#c65f39]/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#c65f39]" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Profile fields filled</p>
          <button onClick={() => onNavigate("profile")} className="mt-2 text-xs font-medium text-[#c65f39] hover:text-[#b55533] flex items-center gap-1">
            Complete <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold text-gray-900">{kbComplete}/{kbItems.length}</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Database className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Knowledge topics covered</p>
          <button onClick={() => onNavigate("sources")} className="mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Add sources <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-bold text-gray-900">{totalChunks}</p>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Knowledge chunks indexed</p>
          <p className="mt-2 text-xs text-gray-400">
            {activeSources} active sources{pendingSources > 0 ? `, ${pendingSources} processing` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Setup Progress</h2>
            <span className="text-xs font-semibold text-gray-400">{progress}%</span>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  item.status === "complete" ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                  {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <p className={cn("text-xs font-medium truncate", item.status === "complete" ? "text-gray-500" : "text-gray-900")}>{item.label}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 capitalize">{item.section === "business_profile" ? "Profile" : "KB"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Why this matters</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your business profile and knowledge base feed directly into your AI agents.
            Completing both ensures accurate answers, bookings, and support.
          </p>
          <div className="flex gap-2 mt-4">
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
  )
}
