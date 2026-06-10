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
  const [previewView, setPreviewView] = useState<"form" | "chat">("form")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Configuration State (All new features included)
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
    trusted_domains: "",
    email_notifications: false
  })

  useEffect(() => {
    if (typeof window === "undefined") return
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
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-10 font-sans bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Web Widget</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and embed the chat interface on your website</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="h-9 rounded-lg text-xs font-medium gap-2 border-gray-100" onClick={() => setPreviewOpen(!previewOpen)}>
              <Eye className="h-4 w-4" /> {previewOpen ? "Hide Preview" : "Show Preview"}
           </Button>
           <Button onClick={handleSave} disabled={saving || !workspaceId} className="h-9 rounded-lg text-xs font-bold gap-2 bg-[#f9510b] hover:bg-[#d8430a] text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
           </Button>
        </div>
      </div>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* LEFT COLUMN: Clean Form sections */}
        <div className="lg:col-span-7 space-y-12 pb-32">
          
          {/* 1. IDENTITY & STYLE */}
          <section className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#f9510b]" /> 1. Identity & Style
            </h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Assistant Display Name</Label>
                <input 
                   value={config.agent_name} 
                   onChange={e => setConfig({...config, agent_name: e.target.value})}
                   className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:border-gray-400 outline-none transition-all" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Primary Color</Label>
                <div className="flex items-center gap-3 p-2 border border-gray-100 rounded-xl">
                  <input 
                     type="color" 
                     value={config.accent_color} 
                     onChange={e => setConfig({...config, accent_color: e.target.value})}
                     className="w-10 h-10 border-none p-0 bg-transparent cursor-pointer" 
                  />
                  <code className="text-xs font-mono text-gray-400 uppercase font-bold">{config.accent_color}</code>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Welcome Message</Label>
                <textarea 
                   value={config.greeting} 
                   onChange={e => setConfig({...config, greeting: e.target.value})}
                   rows={3} 
                   className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:border-gray-400 outline-none resize-none transition-all" 
                />
              </div>
            </div>
          </section>

          {/* 2. LOGIC & BEHAVIOR */}
          <section className="space-y-6">
             <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#f9510b]" /> 2. Logic & Behavior
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl group hover:bg-gray-50/50 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">Anonymous Conversations</Label>
                    <p className="text-[11px] text-gray-400">Skip the lead form and start chatting immediately</p>
                  </div>
                  <Switch checked={config.allow_anonymous} onCheckedChange={val => setConfig({...config, allow_anonymous: val})} />
               </div>

               <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl group hover:bg-gray-50/50 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">Enable WhatsApp Bridge</Label>
                    <p className="text-[11px] text-gray-400">Allow users to switch from web to WhatsApp</p>
                  </div>
                  <Switch checked={config.enable_whatsapp} onCheckedChange={val => setConfig({...config, enable_whatsapp: val })} />
               </div>
            </div>
          </section>

          {/* 3. SECURITY */}
          <section className="space-y-6">
             <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#f9510b]" /> 3. Trust & Security
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Trusted Domains</Label>
                <input 
                   value={config.trusted_domains} 
                   onChange={e => setConfig({...config, trusted_domains: e.target.value})}
                   placeholder="yourdomain.com, landing.app"
                   className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:border-gray-400 outline-none transition-all" 
                />
                <p className="text-[11px] text-gray-400 italic ml-1">List domains separated by commas. Use *.example.com for subdomains. Leave blank for all.</p>
              </div>
            </div>
          </section>

          {/* 4. INSTALLATION */}
          <section className="space-y-6">
             <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-[#f9510b]" /> 4. Installation
            </h3>
            <Card className="p-6 bg-[#111] space-y-4 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="flex justify-between items-center px-2">
                  <Badge className="bg-white/10 text-white/70 border-none text-[10px] font-black uppercase tracking-widest">HTML Script</Badge>
                  <button onClick={copyCode} className="text-xs font-bold text-white flex items-center gap-2 hover:text-[#f9510b] transition-colors">
                     {copied ? <Check className="w-4 h-4 text-[#f9510b]" /> : <Copy className="w-4 h-4" />}
                     {copied ? "Copied" : "Copy Snippet"}
                  </button>
               </div>
               <code className="text-[12px] text-gray-400 font-mono leading-relaxed break-all block p-4 bg-white/5 rounded-2xl">
                  {`<script async\n  data-workspace="${workspaceId || "..."}"\n  src="${origin}/widget/widget.js">\n</script>`}
               </code>
            </Card>
          </section>

        </div>

        {/* RIGHT COLUMN: Simulator Area (Old Design) */}
        <div className="lg:col-span-5 h-full flex flex-col items-center">
           <div className="sticky top-10 flex flex-col items-center gap-8 w-full">
              
              <div className="flex items-center gap-4 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                 <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewView('form')} className={cn("px-5 py-2 rounded-xl text-[11px] font-bold transition-all", previewView === 'form' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600")}>Identity Form</button>
                    <button onClick={() => setPreviewView('chat')} className={cn("px-5 py-2 rounded-xl text-[11px] font-bold transition-all", previewView === 'chat' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600")}>Live Chat</button>
                 </div>
              </div>
              
              <div className="transform scale-[0.85] origin-top transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
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
