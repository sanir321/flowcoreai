"use client"

import { useState, useEffect, useCallback } from "react"
import { Palette, Code, Check, Copy, Eye, Loader2, Save, MessageSquare, Sparkles, Layout, Globe, Smartphone, ShieldCheck, Trash2, Link2, Monitor, Bell } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateWidgetConfig } from "@/app/actions/settings"
import WidgetPreview from "@/components/widget/preview"
import { cn } from "@/lib/utils"

export default function WidgetPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  
  // Preview State
  const [preview, setPreview] = useState(true)
  const [previewView, setPreviewView] = useState<"start" | "form" | "chat">("start")
  const [previewOpen, setPreviewOpen] = useState(true)

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  
  // Config State
  const [config, setConfig] = useState({
    header_text: "FlowCore",
    agent_name: "Support AI",
    greeting: "Hi there! How can I help you today? ✨",
    post_form_message: "Thank you for your interest! Our team will get back to you shortly.",
    accent_color: "#c65f39",
    theme: "dark" as "light" | "dark" | "auto",
    logo_url: "",
    launcher_icon: "chat",
    enable_whatsapp: false,
    allow_anonymous: false,
    auto_fill_params: false,
    default_country: "IN",
    email_notifications: false,
    allowed_domains: [] as string[]
  })

  useEffect(() => {
    setOrigin(window.location.origin)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const wid = user?.app_metadata?.workspace_id as string
      if (wid) {
        setWorkspaceId(wid)
        supabase.from("widget_config").select("*").eq("workspace_id", wid).maybeSingle().then(({ data }) => {
          if (data) {
            setConfig({
              header_text: data.header_text || "FlowCore",
              agent_name: data.agent_name || "Support AI",
              greeting: data.greeting || "Hi there! How can I help you today? ✨",
              post_form_message: data.post_form_message || "Thank you for your interest! Our team will get back to you shortly.",
              accent_color: data.accent_color || "#c65f39",
              theme: data.theme || "dark",
              logo_url: data.logo_url || "",
              launcher_icon: data.launcher_icon || "chat",
              enable_whatsapp: data.enable_whatsapp || false,
              allow_anonymous: data.allow_anonymous || false,
              auto_fill_params: data.auto_fill_params || false,
              default_country: data.default_country || "IN",
              email_notifications: data.email_notifications || false,
              allowed_domains: data.allowed_domains || []
            })
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
      ...config,
    })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Widget configuration saved")
    }
  }, [workspaceId, config])

  const copyCode = () => {
    const snippet = `<script async data-workspace="${workspaceId || "YOUR_WORKSPACE_ID"}" src="${origin}/widget/widget.js"></script>`
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success("Snippet copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 p-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-[#c65f39] border-orange-100 rounded-lg px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider">
              Engagement
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Web Widget</h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Customize and deploy your AI-powered chat interface to any website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !workspaceId}
            className="h-12 rounded-2xl text-sm font-bold gap-2 bg-[#c65f39] hover:bg-[#b55533] px-10 shadow-xl shadow-[#c65f39]/20 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Settings Column */}
        <div className="lg:col-span-6 space-y-12">
          
          {/* 1. Design */}
          <section className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">1</div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Design</h2>
             </div>
             <p className="text-sm text-gray-400 font-medium ml-14">Customize the appearance of your widget</p>

             <Card className="p-8 border-gray-100 rounded-[2.5rem] shadow-sm space-y-8 ml-14 bg-white">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Header Text</Label>
                    <input 
                      value={config.header_text} 
                      onChange={e => setConfig({ ...config, header_text: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#c65f39] transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Assistant Name</Label>
                    <input 
                      value={config.agent_name} 
                      onChange={e => setConfig({ ...config, agent_name: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#c65f39] transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Greeting</Label>
                    <textarea 
                      value={config.greeting} 
                      onChange={e => setConfig({ ...config, greeting: e.target.value })}
                      rows={3}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#c65f39] transition-all resize-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Accent Color</Label>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm">
                      <input
                        type="color"
                        value={config.accent_color}
                        onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                        className="h-12 w-12 rounded-xl border-none p-0 bg-transparent cursor-pointer ring-2 ring-white ring-offset-2"
                      />
                      <div className="flex-1">
                         <p className="text-[13px] font-bold text-gray-900 font-mono uppercase tracking-tight">{config.accent_color}</p>
                         <p className="text-[10px] text-gray-400 font-medium">Used for primary buttons and launcher</p>
                      </div>
                    </div>
                  </div>
                </div>
             </Card>
          </section>

          {/* 2. User Options */}
          <section className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">2</div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Options</h2>
             </div>
             <p className="text-sm text-gray-400 font-medium ml-14">Additional behavior settings for users</p>

             <Card className="p-8 border-gray-100 rounded-[2.5rem] shadow-sm space-y-6 ml-14 bg-white">
                <div className="flex items-center justify-between group">
                   <div className="space-y-0.5">
                      <Label className="text-[13px] font-bold text-gray-900">Enable WhatsApp</Label>
                      <p className="text-[11px] text-gray-400">Add a direct link to your WhatsApp</p>
                   </div>
                   <Switch 
                     checked={config.enable_whatsapp}
                     onCheckedChange={val => setConfig({ ...config, enable_whatsapp: val })}
                   />
                </div>
                <div className="h-px bg-gray-50" />
                <div className="flex items-center justify-between group">
                   <div className="space-y-0.5">
                      <Label className="text-[13px] font-bold text-gray-900">Allow Anonymous Conversations</Label>
                      <p className="text-[11px] text-gray-400">Skip the lead form and start chatting immediately</p>
                   </div>
                   <Switch 
                     checked={config.allow_anonymous}
                     onCheckedChange={val => setConfig({ ...config, allow_anonymous: val })}
                   />
                </div>
                <div className="h-px bg-gray-50" />
                <div className="space-y-2 pt-2">
                   <Label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Default Country</Label>
                   <Select 
                      value={config.default_country} 
                      onValueChange={val => setConfig({ ...config, default_country: val })}
                   >
                      <SelectTrigger className="h-12 bg-gray-50 border-gray-100 rounded-xl">
                         <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="IN">India (+91)</SelectItem>
                         <SelectItem value="US">United States (+1)</SelectItem>
                         <SelectItem value="GB">United Kingdom (+44)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </Card>
          </section>

          {/* 3. Add to Website */}
          <section className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">3</div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Add to your website</h2>
             </div>
             <p className="text-sm text-gray-400 font-medium ml-14">Copy the snippet and paste it in your head tag</p>

             <Card className="p-8 border-gray-100 rounded-[2.5rem] shadow-sm space-y-6 ml-14 bg-white">
                <div className="p-6 rounded-2xl bg-gray-900 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-white/10 text-white/80 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">HTML Script</Badge>
                    <button
                      onClick={copyCode}
                      className="text-[10px] font-bold text-white flex items-center gap-1.5 hover:text-[#c65f39] transition-colors"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy Snippet"}
                    </button>
                  </div>
                  <code className="block text-[11px] text-gray-400 font-mono leading-relaxed break-all opacity-80">
                    {`<script async data-workspace="${workspaceId || "..."}" src="${origin}/widget/widget.js"></script>`}
                  </code>
                </div>
             </Card>
          </section>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-6 flex flex-col gap-8 sticky top-10">
           <div className="bg-gray-100/50 rounded-[3rem] border border-gray-100 p-12 flex flex-col items-center justify-center relative min-h-[750px] overflow-hidden">
             
             {/* Dynamic Preview Controller */}
             <div className="absolute top-10 flex items-center gap-6 px-8 py-4 rounded-full bg-white shadow-2xl border border-gray-50 z-50">
                <div className="flex items-center gap-1">
                   <button 
                    onClick={() => setPreviewView("start")}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", previewView === 'start' ? "bg-black text-white" : "text-gray-400 hover:text-black")}
                   >Start</button>
                   <button 
                    onClick={() => setPreviewView("form")}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", previewView === 'form' ? "bg-black text-white" : "text-gray-400 hover:text-black")}
                   >Form</button>
                   <button 
                    onClick={() => setPreviewView("chat")}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", previewView === 'chat' ? "bg-black text-white" : "text-gray-400 hover:text-black")}
                   >Chat</button>
                </div>
                <div className="w-px h-4 bg-gray-100" />
                <div className="flex items-center gap-1">
                   <button 
                    onClick={() => setPreviewOpen(true)}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", previewOpen ? "bg-black text-white" : "text-gray-400 hover:text-black")}
                   >Open</button>
                   <button 
                    onClick={() => setPreviewOpen(false)}
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", !previewOpen ? "bg-black text-white" : "text-gray-400 hover:text-black")}
                   >Closed</button>
                </div>
             </div>

             {workspaceId && (
               <div className="relative z-10 w-full flex justify-center mt-12 scale-110 origin-center transition-all duration-700">
                  <WidgetPreview 
                    workspaceId={workspaceId} 
                    view={previewView}
                    isOpen={previewOpen}
                    config={config}
                  />
               </div>
             )}

             {/* Website Background Simulation */}
             <div className="absolute inset-0 opacity-[0.3] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 border-gray-100 rounded-[2rem] bg-white flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Monitor className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Responsiveness</p>
                    <p className="text-sm font-bold text-gray-900">Desktop & Mobile Ready</p>
                 </div>
              </Card>
              <Card className="p-6 border-gray-100 rounded-[2rem] bg-white flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <Bell className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Notifications</p>
                    <p className="text-sm font-bold text-gray-900">Real-time AI Alerts</p>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  )
}
