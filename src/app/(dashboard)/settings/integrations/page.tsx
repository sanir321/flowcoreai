"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Settings2,
  Save,
  Lock,
  Bot,
  HelpCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/hooks/use-workspace"
import { getGoogleAuthUrl, updateGoogleConfig, disconnectGoogleIntegration } from "@/app/actions/settings"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
}

const GoogleWorkspaceLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.19 3.28-11.5z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.48-.98 7.31-2.65l-3.57-2.77c-1.01.68-2.31 1.09-3.74 1.09-2.88 0-5.32-1.95-6.19-4.57H2.18v2.85C4.01 20.15 7.74 23 12 23z" fill="#34A853" />
    <path d="M5.81 14.1c-.22-.68-.35-1.41-.35-2.1s.13-1.42.35-2.1V7.05H2.18C1.41 8.54 1 10.22 1 12s.41 3.46 1.18 4.95L5.81 14.1z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.07.56 4.21 1.66l3.15-3.15C17.21 1.88 14.7 1 12 1 7.74 1 4.01 3.85 2.18 7.05l3.63 2.85c.87-2.62 3.31-4.57 6.19-4.57z" fill="#EA4335" />
  </svg>
)

const SalesforceLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#00A1E0">
    <path d="M13.2 5c-1 0-2 .4-2.6 1.2-.6-.8-1.6-1.2-2.6-1.2-1.8 0-3.2 1.4-3.2 3.2v.2c-1.1.2-2 1.2-2 2.3 0 1.3 1.1 2.3 2.3 2.3h10.4c1.3 0 2.3-1.1 2.3-2.3s-1.1-2.3-2.3-2.3c0-.1 0-.1 0-.2C15.5 6.6 14.5 5.5 13.2 5z" />
    <path d="M18.8 10.7c-.5-.3-1-.5-1.6-.5.1-.2.1-.5.1-.7 0-1.8-1.4-3.2-3.2-3.2-1 0-1.9.5-2.5 1.2-.6-.7-1.5-1.2-2.5-1.2-1.8 0-3.2 1.4-3.2 3.2 0 .2 0 .5.1.7-.5 0-1.1.2-1.6.5-1.3.7-1.7 2.4-1 3.7.6 1 1.6 1.6 2.7 1.6h10.4c1.1 0 2.2-.6 2.7-1.6.7-1.3.3-3-1-3.7z" />
  </svg>
)

const INTEGRATIONS = [
  { 
    id: 'google', 
    name: "Google Workspace", 
    desc: "Sync Calendar and Sheets for appointments and leads.", 
    logo: GoogleWorkspaceLogo,
    requirements: [
        { agent: "Appointment Booker", desc: "Required for Calendar Sync", type: "appointment_booking" },
        { agent: "Sales Assistant", desc: "Required for Sheets Sync", type: "sales" }
    ]
  },
  { 
    id: 'salesforce', 
    name: "Salesforce", 
    desc: "Direct CRM synchronization for Agent-level identity tracking.", 
    logo: SalesforceLogo,
    requirements: [
        { agent: "Sales Assistant", desc: "Required for CRM Sync", type: "sales" }
    ]
  },
]

export default function IntegrationsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const router = useRouter()
  const pathname = usePathname()
  const [activeAgentTypes, setActiveAgentTypes] = useState<string[]>([])
  const [connectedIds, setConnectedIds] = useState<string[]>([])
  const [errorIds, setErrorIds] = useState<Record<string, string>>({})
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  const [config, setConfig] = useState({ calendar_id: 'primary', sheet_id: '', sheet_range: 'Sheet1!A:E' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!workspaceId) return

    async function fetchData() {
      const supabase = createClient()

      // Fetch active agents
      const { data: agents } = await (supabase
        .from("workspace_agents") as any)
        .select("agent_type")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .is("deleted_at", null)
      
      if (agents) {
        setActiveAgentTypes((agents as any[]).map(a => a.agent_type))
      }

      // Fetch connection status
      try {
        const res = await fetch("/api/auth/google/status")
        const json = await res.json()
        
        if (json && !json.error) {
          setConnectedIds(['google'])
          setConfig({
            calendar_id: json.calendar_id || 'primary',
            sheet_id: json.sheet_id || '',
            sheet_range: json.sheet_range || 'Sheet1!A:E'
          })
        } else {
          setConnectedIds([])
          if (json?.error) console.warn("Google status error:", json.error)
        }
      } catch (e) {
        console.warn("Google status fetch failed (likely not connected):", e)
        setConnectedIds([])
      }
    }
    
    fetchData()
  }, [workspaceId])

  const handleConnect = async (id: string) => {
    if (id !== 'google') {
      toast.info("Salesforce integration coming soon!")
      return
    }

    if (!workspaceId) {
      toast.error("No workspace ID found")
      return
    }

    setIsActionLoading(id)
    setErrorIds(prev => ({ ...prev, [id]: "" }))
    const result = await getGoogleAuthUrl(workspaceId)
    
    if (result.error || !result.data) {
      toast.error(result.error || "Failed to generate auth URL")
      setErrorIds(prev => ({ ...prev, [id]: result.error || "Failed to generate auth URL" }))
      setIsActionLoading(null)
    } else {
      // Store nonce in cookie for CSRF binding verification in callback
      document.cookie = `google_oauth_nonce=${result.data.nonce}; path=/api/auth/google/callback; maxAge=600; SameSite=Lax; Secure`
      window.location.assign(result.data.url)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (id !== 'google' || !workspaceId) return

    setIsActionLoading(id)
    const result = await disconnectGoogleIntegration(workspaceId)

    if (result.error) {
      toast.error("Failed to disconnect")
      setErrorIds(prev => ({ ...prev, [id]: "Failed to disconnect" }))
    } else {
      setConnectedIds([])
      router.replace(pathname)
      toast.success("Disconnected from Google")
    }
    setIsActionLoading(null)
  }

  const handleSaveConfig = async () => {
    if (!workspaceId) return
    setIsSaving(true)
    const result = await updateGoogleConfig({
      workspace_id: workspaceId,
      ...config
    })
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Configuration saved")
    }
    setIsSaving(false)
  }

  if (wsLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-10 font-sans pb-32">
      <motion.div {...fadeUp}>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Integrations</h1>
        <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">Connect your workspace with external platforms to enable specialized agent capabilities.</p>
      </motion.div>
      
      <div className="grid grid-cols-1 gap-8">
        {INTEGRATIONS.map((item) => {
          const isConnected = connectedIds.includes(item.id)
          const isLoading = isActionLoading === item.id
          const errorMsg = errorIds[item.id]
          const isRequirementsMet = item.requirements.some(req => activeAgentTypes.includes(req.type))

          return (
            <motion.div key={item.id} {...fadeUp} className="space-y-6">
              <Card className={cn(
                "p-10 bg-white border-gray-100 flex items-center justify-between group hover:border-black/5 hover:shadow-md transition-all duration-500 rounded-[2.5rem]",
                errorMsg && "border-red-100 bg-red-50/10",
                !isRequirementsMet && "opacity-80 border-dashed"
              )}>
                <div className="flex items-center gap-6">
                    <div className={cn(
                      "h-16 w-16 rounded-[1.5rem] border border-gray-100 flex items-center justify-center transition-all duration-500 shadow-inner p-3",
                      isConnected ? "bg-emerald-50 border-emerald-100" : (errorMsg ? "bg-red-50 border-red-100" : "bg-gray-50 group-hover:bg-white")
                    )}>
                      <item.logo className="h-full w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                          {isConnected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {!isRequirementsMet && (
                             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                                <Lock className="h-2.5 w-2.5" />
                                <span className="text-[9px] font-bold">Action Required</span>
                             </div>
                          )}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{errorMsg || item.desc}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                    onClick={() => isConnected ? handleDisconnect(item.id) : handleConnect(item.id)}
                    disabled={isLoading}
                    variant={isConnected ? "secondary" : (errorMsg ? "destructive" : "default")}
                    className={cn(
                        "h-11 px-8 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95",
                        isConnected && "bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                    )}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isConnected ? "Disconnect" : (errorMsg ? "Retry" : "Connect Now"))}
                    </Button>
                </div>
              </Card>

              {/* Requirements Hint */}
              {!isConnected && (
                <div className="px-8 flex flex-wrap gap-4 items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enables Capability For:</span>
                    {item.requirements.map(req => (
                        <div key={req.type} className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all",
                            activeAgentTypes.includes(req.type) 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                : "bg-gray-50 border-gray-100 text-gray-400"
                        )}>
                            <Bot className="h-3.5 w-3.5" />
                            <span>{req.agent}</span>
                            {activeAgentTypes.includes(req.type) && <CheckCircle2 className="h-3 w-3 ml-1" />}
                        </div>
                    ))}
                    {!isRequirementsMet && (
                        <Link href="/agent-hub" className="text-[10px] font-bold text-[#c65f39] hover:underline flex items-center gap-1 ml-auto">
                            Go to Agent Hub <ArrowRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>
              )}

              <AnimatePresence>
                {isConnected && item.id === 'google' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-10 mt-6 bg-gray-50/50 border-gray-100 space-y-10 rounded-[2.5rem] relative overflow-hidden shadow-sm">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                          <Settings2 className="h-40 w-40 text-black" />
                       </div>

                       <div className="space-y-1 relative z-10 text-gray-900">
                          <h4 className="text-[10px] font-bold text-[#c65f39]">Automated Sync</h4>
                          <p className="text-lg font-semibold text-gray-900 tracking-tight">Active Google Connection</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 text-gray-900">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-bold text-gray-500 ml-1">Default Calendar</Label>
                             <Input 
                                value={config.calendar_id}
                                onChange={e => setConfig(prev => ({ ...prev, calendar_id: e.target.value }))}
                                placeholder="primary"
                                className="h-12 bg-white border-gray-200 rounded-xl text-sm focus:border-black/10 transition-all font-medium text-gray-900"
                             />
                             <p className="text-[10px] text-gray-500 ml-1 font-medium italic">Target identifier for the Booking Agent.</p>
                          </div>

                          <div className="space-y-3">
                             <Label className="text-[10px] font-bold text-gray-500 ml-1">Lead Capture Sheet ID</Label>
                             <Input 
                                value={config.sheet_id}
                                onChange={e => setConfig(prev => ({ ...prev, sheet_id: e.target.value }))}
                                placeholder="1abc123..."
                                className="h-12 bg-white border-gray-200 rounded-xl text-sm focus:border-black/10 transition-all font-medium text-gray-900"
                             />
                             <p className="text-[10px] text-gray-500 ml-1 font-medium italic">Target identifier for the Sales Assistant.</p>
                          </div>

                          <div className="space-y-3 md:col-span-2 border-t border-gray-100 pt-8">
                             <Label className="text-[10px] font-bold text-gray-500 ml-1">Destination Sheet Range</Label>
                             <div className="flex gap-4">
                                <Input 
                                    value={config.sheet_range}
                                    onChange={e => setConfig(prev => ({ ...prev, sheet_range: e.target.value }))}
                                    placeholder="Sheet1!A:E"
                                    className="h-12 bg-white border-gray-200 rounded-xl text-sm flex-1 font-medium text-gray-900"
                                />
                                <Button 
                                    onClick={handleSaveConfig}
                                    disabled={isSaving}
                                    className="h-12 px-8 rounded-xl bg-black text-white hover:bg-gray-800 flex items-center gap-3 text-[11px] font-bold transition-all active:scale-95"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Sync Configuration
                                </Button>
                             </div>
                           <p className="text-[10px] text-gray-500 ml-1 font-medium italic">Specify tab and column range (e.g., Sheet1!A:H) for data sync.</p>
                           </div>

                           <div className="space-y-3 md:col-span-2 border-t border-gray-100 pt-8">
                              <Label className="text-[10px] font-bold text-gray-500 ml-1">Download Spreadsheet</Label>
                              <div className="flex gap-4 items-center">
                                 <a
                                    href="/api/sheets/download"
                                    className="inline-flex h-12 px-8 rounded-xl bg-black text-white hover:bg-gray-800 items-center gap-3 text-[11px] font-bold transition-all active:scale-95 no-underline"
                                 >
                                    <Save className="h-4 w-4" />
                                    Download as CSV
                                 </a>
                              </div>
                              <p className="text-[10px] text-gray-500 ml-1 font-medium italic">Download the Google Sheet data as a CSV file.</p>
                           </div>
                        </div>
                     </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
