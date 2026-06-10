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
import { ScrollArea } from "@/components/ui/scroll-area"

export default function WidgetSettingsPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [prefillOpen, setPrefillOpen] = useState(false)
  
  // Preview Controls
  const [previewView, setPreviewView] = useState<"start" | "form" | "chat">("start")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Configuration State
  const [config, setConfig] = useState({
    header_text: "FlowCore",
    agent_name: "Support AI",
    greeting: "Hi there, how can we help?",
    post_form_message: "Thank you for filling out the form. Feel free to add any more info while we connect you with the right person!",
    accent_color: "#c65f39",
    launcher_color: "#c65f39",
    launcher_icon: "chat",
    enable_whatsapp: false,
    allow_anonymous: false,
    auto_fill_params: false,
    default_country: "IN",
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
              agent_name: d.agent_name || "Support AI",
              greeting: d.greeting || "Hi there, how can we help?",
              post_form_message: d.post_form_message || "Thank you for filling out the form. Feel free to add any more info while we connect you with the right person!",
              accent_color: d.accent_color || "#c65f39",
              launcher_color: d.launcher_color || d.accent_color || "#c65f39",
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

  const copySnippet = (type: 'html' | 'gtm') => {
    const code = type === 'html' 
      ? `<script async data-workspace="${workspaceId || "..."}" src="${origin}/widget/widget.js"></script>`
      : `<!-- GTM Placeholder for ${workspaceId} -->`
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Snippet copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      
      {/* LEFT COLUMN: Scrollable Settings */}
      <div className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        <ScrollArea className="flex-1 scrollbar-none">
          <div className="max-w-[800px] px-8 lg:px-16 py-20 space-y-24 mx-auto pb-48">
            
            {/* Header Info */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Configuration</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-[#c65f39]">Web Widget</span>
               </div>
               <h1 className="text-5xl font-black tracking-tight text-white leading-none font-outfit">Web Widget</h1>
               <p className="text-white/50 text-base leading-relaxed max-w-lg font-medium">Customize your AI-powered chat interface and integrate it anywhere with a single snippet.</p>
            </div>

            {/* 1. DESIGN */}
            <section className="space-y-12">
               <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-[1.25rem] bg-[#c65f39]/10 border border-[#c65f39]/20 text-[#c65f39] flex items-center justify-center font-black text-xl shadow-[0_0_30px_-5px_rgba(198,95,57,0.3)]">1</div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight font-outfit">Identity & Design</h2>
                    <p className="text-sm text-white/40 font-medium">Shape the personality and look of your assistant</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-10 pl-16">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Widget Heading</Label>
                    <input 
                      value={config.header_text}
                      onChange={e => setConfig({ ...config, header_text: e.target.value })}
                      className="w-full h-14 px-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-[#c65f39]/50 focus:ring-4 focus:ring-[#c65f39]/5 transition-all outline-none text-white font-semibold text-base" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Assistant Display Name</Label>
                    <input 
                      value={config.agent_name}
                      onChange={e => setConfig({ ...config, agent_name: e.target.value })}
                      className="w-full h-14 px-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-[#c65f39]/50 focus:ring-4 focus:ring-[#c65f39]/5 transition-all outline-none text-white font-semibold text-base" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Welcome Message</Label>
                    <textarea 
                      value={config.greeting}
                      onChange={e => setConfig({ ...config, greeting: e.target.value })}
                      rows={3}
                      className="w-full p-5 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-[#c65f39]/50 focus:ring-4 focus:ring-[#c65f39]/5 transition-all outline-none text-white font-semibold text-base resize-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Brand Accent Color</Label>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]">
                        <input
                          type="color"
                          value={config.accent_color}
                          onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                          className="h-10 w-10 rounded-xl border-none p-0 bg-transparent cursor-pointer ring-2 ring-white/10"
                        />
                        <code className="text-sm font-bold text-white/80 font-mono uppercase">{config.accent_color}</code>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Launcher Icon Color</Label>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]">
                        <input
                          type="color"
                          value={config.launcher_color}
                          onChange={(e) => setConfig({ ...config, launcher_color: e.target.value })}
                          className="h-10 w-10 rounded-xl border-none p-0 bg-transparent cursor-pointer ring-2 ring-white/10"
                        />
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c65f39]">
                           <MessageSquare className="w-5 h-5 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </section>

            {/* 2. BEHAVIOR */}
            <section className="space-y-12">
               <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-[1.25rem] bg-[#c65f39]/10 border border-[#c65f39]/20 text-[#c65f39] flex items-center justify-center font-black text-xl shadow-[0_0_30px_-5px_rgba(198,95,57,0.3)]">2</div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight font-outfit">Behavior & Logic</h2>
                    <p className="text-sm text-white/40 font-medium">Control how users interact with your agent</p>
                  </div>
               </div>

               <div className="space-y-6 pl-16">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                     <div className="space-y-1">
                        <Label className="text-sm font-bold text-white group-hover:text-[#c65f39] transition-colors">Enable WhatsApp Bridge</Label>
                        <p className="text-[11px] text-white/30 font-medium">Allow users to switch from web to WhatsApp</p>
                     </div>
                     <Switch checked={config.enable_whatsapp} onCheckedChange={val => setConfig({ ...config, enable_whatsapp: val })} />
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                     <div className="space-y-1">
                        <Label className="text-sm font-bold text-white group-hover:text-[#c65f39] transition-colors">Anonymous Conversations</Label>
                        <p className="text-[11px] text-white/30 font-medium">Skip the identity form and chat instantly</p>
                     </div>
                     <Switch checked={config.allow_anonymous} onCheckedChange={val => setConfig({ ...config, allow_anonymous: val })} />
                  </div>

                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                     <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] ml-1">Default Region</Label>
                     <Select 
                        value={config.default_country} 
                        onValueChange={val => setConfig({ ...config, default_country: val })}
                     >
                        <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white font-semibold">
                           <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10 text-white">
                           <SelectItem value="IN">India (+91)</SelectItem>
                           <SelectItem value="US">United States (+1)</SelectItem>
                           <SelectItem value="GB">United Kingdom (+44)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </section>

            {/* 3. INSTALLATION */}
            <section className="space-y-12">
               <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-[1.25rem] bg-[#c65f39]/10 border border-[#c65f39]/20 text-[#c65f39] flex items-center justify-center font-black text-xl shadow-[0_0_30px_-5px_rgba(198,95,57,0.3)]">3</div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight font-outfit">Installation</h2>
                    <p className="text-sm text-white/40 font-medium">Deploy the widget to your production site</p>
                  </div>
               </div>

               <div className="space-y-8 pl-16">
                  <div className="p-1.5 bg-white/[0.03] rounded-2xl border border-white/5 flex gap-2 w-fit">
                     <button className="px-6 py-2 rounded-xl bg-[#c65f39] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-[#c65f39]/20">HTML Snippet</button>
                     <button className="px-6 py-2 rounded-xl text-white/30 hover:text-white/60 text-xs font-black uppercase tracking-widest transition-all">GTM Container</button>
                  </div>

                  <div className="p-8 bg-black border border-white/10 rounded-3xl relative group overflow-hidden shadow-2xl">
                     <div className="absolute inset-0 bg-gradient-to-tr from-[#c65f39]/5 to-transparent pointer-events-none" />
                     <button 
                        onClick={() => copySnippet('html')}
                        className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#c65f39] hover:border-[#c65f39]/30 transition-all z-20"
                     >
                        {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                     </button>
                     <pre className="text-sm text-[#c65f39]/70 font-mono leading-relaxed select-all overflow-x-auto relative z-10 scrollbar-none">
                        {`<script async\n  data-workspace="${workspaceId || "..."}"\n  src="${origin}/widget/widget.js">\n</script>`}
                     </pre>
                  </div>

                  <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/[0.01] border border-dashed border-white/10">
                     <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Developer Tip</p>
                        <p className="text-xs text-white/40 leading-relaxed">Paste this code right before the <code className="text-white font-mono">&lt;/body&gt;</code> tag on every page you want the widget to appear.</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* SAVE BUTTON */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 lg:left-[calc(27.5%+64px)] z-[100]">
               <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="h-16 px-12 rounded-[2rem] bg-[#c65f39] hover:bg-[#b55533] text-white font-black text-lg shadow-[0_20px_50px_rgba(198,95,57,0.4)] transition-all active:scale-95 flex items-center gap-4 border-none"
               >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  {saving ? "Deploying Changes..." : "Deploy Widget Config"}
               </Button>
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: Sticky Preview Area */}
      <div className="hidden lg:flex w-[45%] h-full flex-col items-center justify-center relative overflow-hidden bg-[#080808]">
         {/* Background Visuals */}
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#c65f39]/5 rounded-full blur-[120px] -mr-48 -mt-48" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -ml-24 -mb-24" />

         {/* Preview Controller */}
         <div className="absolute top-16 space-y-6 flex flex-col items-center z-50">
            <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-xl shadow-2xl">
               <button 
                onClick={() => setPreviewView("start")}
                className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", previewView === 'start' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white/60")}
               >Start</button>
               <button 
                onClick={() => setPreviewView("form")}
                className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", previewView === 'form' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white/60")}
               >Form</button>
               <button 
                onClick={() => setPreviewView("chat")}
                className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", previewView === 'chat' ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white/60")}
               >Chat</button>
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className="flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] transition-all group"
               >
                  {previewOpen ? <X className="w-3.5 h-3.5 text-white/20 group-hover:text-[#c65f39]" /> : <MessageSquare className="w-3.5 h-3.5 text-white/20 group-hover:text-[#c65f39]" />}
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">{previewOpen ? "Close Widget" : "Open Widget"}</span>
               </button>
            </div>
         </div>

         {/* The Widget Preview (Compact) */}
         <div className="relative z-10 transform scale-90 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {workspaceId && (
              <WidgetPreview 
                workspaceId={workspaceId}
                view={previewView} 
                isOpen={previewOpen} 
                config={config as any}
              />
            )}
         </div>

         {/* Stats Cards */}
         <div className="absolute bottom-16 grid grid-cols-2 gap-6 w-full max-w-[440px] px-8">
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-3">
               <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Layout className="w-4 h-4" />
               </div>
               <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.15em]">Interface</p>
               <p className="text-xs font-bold text-white/80 leading-tight">Pixel-perfect responsive design.</p>
            </div>
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-3">
               <div className="h-8 w-8 rounded-xl bg-[#c65f39]/10 border border-[#c65f39]/20 text-[#c65f39] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
               </div>
               <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.15em]">Intelligence</p>
               <p className="text-xs font-bold text-white/80 leading-tight">Groq-powered Support agent.</p>
            </div>
         </div>

         {/* Background Grid */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

    </div>
  )
}
