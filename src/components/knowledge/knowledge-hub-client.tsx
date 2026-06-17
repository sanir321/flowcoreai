"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Globe, Zap, Bot, Sparkles } from "lucide-react"
import { BusinessProfileClient } from "@/app/(dashboard)/settings/business-profile/business-profile-client"
import { SourcesTab } from "@/components/knowledge/sources-tab"
import { OverviewTab } from "@/components/knowledge/overview-tab"
import { toast } from "sonner"

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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Knowledge Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your business profile and knowledge base in one place.</p>
        </div>
        <button
          onClick={handleRegenerateKB}
          disabled={regenerating}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate KB
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start gap-1 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="overview" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-[#c65f39] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700">
            <Bot className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profile" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-[#c65f39] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700">
            <Zap className="h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="sources" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-[#c65f39] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700">
            <Globe className="h-4 w-4" />
            Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            workspaceId={workspaceId}
            businessProfile={initialBusinessProfile}
            sources={initialSources}
            templates={initialTemplates}
            usedTags={initialUsedTags}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <BusinessProfileClient
            workspaceId={workspaceId}
            initialProfile={initialBusinessProfile}
            businessType={businessType}
            initialServicesOffered={initialServicesOffered}
            initialSuggestions={initialSuggestions}
          />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <SourcesTab
            initialSources={initialSources}
            workspaceId={workspaceId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
