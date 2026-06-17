"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Globe, Zap, Bot } from "lucide-react"
import { BusinessProfileClient } from "@/app/(dashboard)/settings/business-profile/business-profile-client"
import { KnowledgeClient } from "@/components/knowledge/knowledge-client"
import { OverviewTab } from "@/components/knowledge/overview-tab"
import { cn } from "@/lib/utils"
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Knowledge Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your business profile and knowledge base in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerateKB} disabled={regenerating} className="h-9 px-3">
            {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <> <RefreshCw className="h-4 w-4 mr-1" /> Regenerate KB </>}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#c65f39] data-[state=active]:text-white">
            <Bot className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#c65f39] data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-[#c65f39] data-[state=active]:text-white">
            <Globe className="h-4 w-4 mr-2" />
            Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 animate-in fade-in-0">
          <OverviewTab
            workspaceId={workspaceId}
            businessProfile={initialBusinessProfile}
            sources={initialSources}
            templates={initialTemplates}
            usedTags={initialUsedTags}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6 animate-in fade-in-0">
          <BusinessProfileClient
            workspaceId={workspaceId}
            initialProfile={initialBusinessProfile}
            businessType={businessType}
            initialServicesOffered={initialServicesOffered}
            initialSuggestions={initialSuggestions}
          />
        </TabsContent>

        <TabsContent value="sources" className="mt-6 animate-in fade-in-0">
          <KnowledgeClient
            initialSources={initialSources}
            workspaceId={workspaceId}
            initialBusinessProfile={initialBusinessProfile}
            initialTemplates={initialTemplates}
            initialUsedTags={initialUsedTags}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const btnVariants = {
  default: "bg-[#c65f39] text-white hover:bg-[#b55533] shadow-lg shadow-[#c65f39]/20",
  outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
}
const btnSizes = {
  default: "h-11 px-6 text-sm",
  sm: "h-9 px-4 text-xs",
  lg: "h-12 px-8 text-base",
  icon: "h-11 w-11",
}

function Button({ children, variant = "default", size = "default", className, disabled, onClick, ...props }: { children: React.ReactNode; variant?: keyof typeof btnVariants; size?: keyof typeof btnSizes; className?: string; disabled?: boolean; onClick?: () => void; [key: string]: any }) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#c65f39]/20"
  return (
    <button
      className={cn(baseStyles, btnVariants[variant], btnSizes[size], className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}