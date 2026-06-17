"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw, Globe, Building2, LayoutDashboard, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessProfileClient } from "@/app/(dashboard)/settings/business-profile/business-profile-client"
import { SourcesTab } from "@/components/knowledge/sources-tab"
import { OverviewTab } from "@/components/knowledge/overview-tab"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface KnowledgeHubClientProps {
  workspaceId: string
  initialBusinessProfile: any
  businessType: string
  initialServicesOffered?: string
  initialSuggestions?: Record<string, unknown> | null
  initialSources: any[]
  initialTemplates: any[]
  initialUsedTags: string[]
}

const sidebarItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "Business Profile", icon: Building2 },
  { key: "sources", label: "Sources", icon: Globe },
] as const

export function KnowledgeHubClient({
  workspaceId,
  initialBusinessProfile,
  businessType,
  initialServicesOffered = "",
  initialSuggestions = null,
  initialSources,
  initialTemplates,
  initialUsedTags,
}: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "sources">("overview")
  const [regenerating, setRegenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab === "profile") setActiveTab("profile")
    else if (tab === "sources") setActiveTab("sources")
  }, [])

  const handleRegenerateKB = async () => {
    setRegenerating(true)
    try {
      const response = await fetch(`/api/knowledge/regenerate-from-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(`KB regenerated: ${data.chunks_created} chunks created`)
        window.location.reload()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate KB")
    } finally {
      setRegenerating(false)
    }
  }

  const tabLabel = activeTab === "overview" ? "Overview" : activeTab === "profile" ? "Business Profile" : "Sources"

  return (
    <div className="flex w-full max-w-7xl mx-auto min-h-[calc(100vh-8rem)]">
      <aside className="w-64 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-sm font-semibold text-gray-900">Knowledge Hub</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === key
                  ? "bg-[#c65f39]/10 text-[#c65f39]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleRegenerateKB}
            disabled={regenerating}
            className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-10">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-between min-h-[40px]">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{tabLabel}</h2>
            {activeTab === "sources" && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="h-11 px-8 bg-[#c65f39] hover:bg-[#b55533] text-white rounded-xl font-semibold shadow-lg shadow-[#c65f39]/20 transition-all gap-2 text-sm"
              >
                <Plus className="h-4 w-4" /> Add Source
              </Button>
            )}
          </div>

          {activeTab === "overview" && (
            <OverviewTab
              businessProfile={initialBusinessProfile}
              sources={initialSources}
              templates={initialTemplates}
              usedTags={initialUsedTags}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "profile" && (
            <BusinessProfileClient
              workspaceId={workspaceId}
              initialProfile={initialBusinessProfile}
              businessType={businessType}
              initialServicesOffered={initialServicesOffered}
              initialSuggestions={initialSuggestions}
            />
          )}
          {activeTab === "sources" && (
            <SourcesTab
              initialSources={initialSources}
              workspaceId={workspaceId}
              dialogOpen={dialogOpen}
              onDialogOpenChange={setDialogOpen}
            />
          )}
        </div>
      </main>
    </div>
  )
}
