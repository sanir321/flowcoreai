"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Palette, Code, Check, Copy, Eye, Loader2, Save, 
  MessageSquare, Sparkles, Layout, Globe, Smartphone, 
  ShieldCheck, Trash2, Link2, Monitor, Bell, Bot,
  Settings, UserCog, ExternalLink, ChevronRight,
  Plus, MoreHorizontal, Info, ChevronDown, Wrench,
  Laptop, X
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateWidgetConfig } from "@/app/actions/settings"
import WidgetPreview from "@/components/widget/preview"
import { cn } from "@/lib/utils"

export default function WidgetSettingsPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  
  // Preview Controls
  const [previewView, setPreviewView] = useState<"start" | "form" | "chat">("chat")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Configuration State
  const [config, setConfig] = useState({
    header_text: "FlowCore",
    agent_name: "Assistant",
    greeting: "Hi! How can I help?",
    post_form_message: "Thank you! How can I help you today?",
    accent_color: "#050505",
    launcher_icon: "chat",
    enable_whatsapp: false,
    allow_anonymous: false,
    auto_fill_params: false,
    default_country: "IN",
    trusted_domains: "",
    email_notifications: false
  })

  useEffect(() => {
    setOrigin(window.location.origin)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const wid = user?.app_metadata?.workspace_id as string
      if (wid) {
        setWorkspaceId(wid)
        supabase.from("widget_config").select("*").eq("workspace_id", wid).maybeSingle().then(({ data }) => {
          const d = data as any
          if (d) {
            setConfig({
              header_text: d.header_text || "FlowCore",
              agent_name: d.agent_name || "Assistant",
              greeting: d.greeting || "Hi! How can I help?",
              post_form_message: d.post_form_message || "Thank you! How can I help you today?",
              accent_color: d.accent_color || "#050505",
              launcher_icon: d.launcher_icon || "chat",
              enable_whatsapp: d.enable_whatsapp || false,
              allow_anonymous: d.allow_anonymous || false,
              auto_fill_params: d.auto_fill_params || false,
              default_country: d.default_country || "IN",
              trusted_domains: d.allowed_domains?.join(", ") || "",
              email_notifications: d.email_notifications || false
            })
          }
        })
      }
    })
  }, [])

  const handleSave = async () => {
    if (!workspaceId) return
    setSaving(true)
    const result = await updateWidgetConfig({
      workspace_id: workspaceId,
      ...config,
      allowed_domains: config.trusted_domains.split(",").map(d => d.trim()).filter(Boolean)
    })
    setSaving(false)
    if (result.error) toast.error(result.error)
    else toast.success("Widget configuration saved")
  }

  const copyCode = () => {
    navigator.clipboard.writeText(`<script async data-workspace="${workspaceId || "..."}" src="${origin}/widget/widget.js"></script>`)
    setCopied(true)
    toast.success("Code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-10 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web Widget</h1>
          <p className="text-sm text-gray-500">Configure and embed the chat interface on your website</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="h-9 rounded-lg text-xs font-medium gap-2" onClick={() => setPreviewOpen(!previewOpen)}>
              <Eye className="w-4 h-4" /> {previewOpen ? "Hide Preview" : "Show Preview"}
           </Button>
           <Button onClick={handleSave} disabled={saving || !workspaceId} className="h-9 rounded-lg text-xs font-bold gap-2 bg-[#f9510b] hover:bg-[#d8430a]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Config
           </Button>
        </div>
      </div>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-12">
          
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" /> Identity & Style
            </h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Assistant Name</Label>
                <input 
                   value={config.agent_name} 
                   onChange={e => setConfig({...config, agent_name: e.target.value})}
                   className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:border-gray-400 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input 
                     type="color" 
                     value={config.accent_color} 
                     onChange={e => setConfig({...config, accent_color: e.target.value})}
                     className="w-10 h-10 border border-gray-200 p-1 rounded-lg cursor-pointer" 
                  />
                  <code className="text-xs font-mono text-gray-400 uppercase">{config.accent_color}</code>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Welcome Message</Label>
                <textarea 
                   value={config.greeting} 
                   onChange={e => setConfig({...config, greeting: e.target.value})}
                   rows={3} 
                   className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:border-gray-400 outline-none resize-none" 
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" /> Behavior
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <Label className="text-xs font-bold text-gray-700">Allow Anonymous Chat</Label>
                  <Switch checked={config.allow_anonymous} onCheckedChange={val => setConfig({...config, allow_anonymous: val})} />
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <Label className="text-xs font-bold text-gray-700">Enable WhatsApp Link</Label>
                  <Switch checked={config.enable_whatsapp} onCheckedChange={val => setConfig({...config, enable_whatsapp: val})} />
               </div>
            </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-400" /> Implementation
            </h3>
            <Card className="p-6 bg-gray-900 space-y-4 rounded-2xl overflow-hidden shadow-xl">
               <div className="flex justify-between items-center">
                  <Badge className="bg-white/10 text-white/70 border-none text-[10px]">HTML</Badge>
                  <button onClick={copyCode} className="text-xs font-bold text-white flex items-center gap-1.5 hover:text-[#f9510b]">
                     {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                     {copied ? "Copied" : "Copy Code"}
                  </button>
               </div>
               <code className="text-[11px] text-gray-400 font-mono leading-relaxed break-all block">
                  {`<script async data-workspace="${workspaceId || "..."}" src="${origin}/widget/widget.js"></script>`}
               </code>
            </Card>
          </section>

          <section className="space-y-6">
             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" /> Whitelist Domains
            </h3>
            <input 
               value={config.trusted_domains} 
               onChange={e => setConfig({...config, trusted_domains: e.target.value})}
               placeholder="example.com, mysite.com"
               className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:border-gray-400 outline-none" 
            />
            <p className="text-[11px] text-gray-400">List domains separated by commas. Leave blank for all.</p>
          </section>

        </div>

        <div className="h-full flex flex-col items-center">
           <div className="sticky top-10 flex flex-col items-center gap-8 w-full max-w-[400px]">
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                 <button onClick={() => setPreviewView('form')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest", previewView === 'form' ? "bg-white text-black shadow-sm" : "text-gray-400")}>Form</button>
                 <button onClick={() => setPreviewView('chat')} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest", previewView === 'chat' ? "bg-white text-black shadow-sm" : "text-gray-400")}>Chat</button>
              </div>
              
              <div className="transform scale-95 origin-top transition-all duration-500">
                {workspaceId && (
                  <WidgetPreview 
                    workspaceId={workspaceId}
                    view={previewView} 
                    isOpen={previewOpen} 
                    config={config as any}
                  />
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
