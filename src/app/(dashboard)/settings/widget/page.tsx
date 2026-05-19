"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Palette, 
  MessageSquare, 
  Code, 
  Monitor, 
  Smartphone, 
  Check, 
  Copy,
  Eye,
  Settings as SettingsIcon,
  Sparkles,
  Loader2,
  Save
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateWidgetConfig } from "@/app/actions/settings"

interface WidgetConfig {
  color: string
  greeting: string
}

export default function WidgetPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('https://flowcore-ai.com')
  const [saving, setSaving] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [config, setConfig] = useState<WidgetConfig>({
    color: "#D95E46",
    greeting: "Welcome. How can I help you today?"
  })

  useEffect(() => {
    setOrigin(window.location.origin)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const wid = user?.app_metadata?.workspace_id as string
      if (wid) {
        setWorkspaceId(wid)
        supabase.from('widget_config').select('accent_color, greeting').eq('workspace_id', wid).maybeSingle().then(({ data }) => {
          if (data) {
            setConfig({ color: data.accent_color || '#D95E46', greeting: data.greeting || "Welcome. How can I help you today?" })
          }
        })
      }
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!workspaceId) return
    setSaving(true)
    const result = await updateWidgetConfig({
      workspace_id: workspaceId,
      accent_color: config.color,
      greeting: config.greeting,
    })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Widget config saved")
    }
  }, [workspaceId, config])

  const copyCode = () => {
    navigator.clipboard.writeText(`<script src="${origin}/widget.js" async></script>`)
    setCopied(true)
    toast.success("Widget code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Web Widget</h1>
        <Button variant="outline" className="h-9 rounded-lg text-xs font-medium gap-2">
           <Eye className="h-4 w-4" /> Live Preview
        </Button>
      </div>
      <p className="text-sm text-gray-500">Configure and embed the FlowCore chat interface on your website</p>
      
      <hr className="border-gray-100 my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Configuration Form */}
         <div className="space-y-10">
            <section className="space-y-6">
               <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-500" /> Identity & Style
               </h3>
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label className="text-xs text-gray-700">Primary Color</Label>
                     <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={config.color}
                          onChange={(e) => setConfig({...config, color: e.target.value})}
                          className="h-10 w-10 rounded border border-gray-200 p-1 bg-white cursor-pointer"
                        />
                        <code className="text-xs text-gray-500 uppercase">{config.color}</code>
                     </div>
                  </div>
               </div>
            </section>

            <section className="space-y-6">
               <Button onClick={handleSave} disabled={saving || !workspaceId} className="h-10 rounded-lg text-xs font-medium gap-2 bg-[#D95E46] hover:bg-[#c04e3a]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Widget Config"}
               </Button>
            </section>
            <section className="space-y-6">
               <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Code className="h-4 w-4 text-gray-500" /> Implementation
               </h3>
               <Card className="p-6 bg-gray-50 border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-medium text-gray-700">Embed Script</p>
                     <button 
                       onClick={copyCode}
                       className="text-xs font-semibold text-[#D95E46] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                     >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy Code"}
                     </button>
                  </div>
                  <code 
                    suppressHydrationWarning
                    className="block p-4 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 break-all"
                  >
                     {`<script src="${origin}/widget.js" async></script>`}
                  </code>
               </Card>
            </section>
         </div>

         {/* Visual Preview */}
         <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex items-center justify-center relative min-h-[500px]">
            <div className="absolute top-4 left-4 flex gap-2">
               <div className="h-2 w-2 rounded-full bg-gray-200" /><div className="h-2 w-2 rounded-full bg-gray-200" /><div className="h-2 w-2 rounded-full bg-gray-200" />
            </div>
            
            {/* Mock Widget */}
            <div className="w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[440px]">
               <div className="h-16 px-6 flex items-center gap-3 text-white" style={{ backgroundColor: config.color }}>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                     <SettingsIcon className="h-4 w-4" />
                  </div>
                   <span className="text-sm font-semibold">Support Agent</span>
               </div>
               <div className="flex-1 p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl rounded-tl-none text-xs text-gray-600 leading-relaxed border border-gray-100">
                     {config.greeting}
                  </div>
               </div>
               <div className="p-4 border-t border-gray-50">
                  <div className="h-10 w-full bg-gray-50 border border-gray-100 rounded-lg flex items-center px-4">
                     <span className="text-xs text-gray-400">Type a message...</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
