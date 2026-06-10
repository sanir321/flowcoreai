"use client"

import { useState, useEffect, useCallback } from "react"
import { Palette, Code, Check, Copy, Eye, Loader2, Save, MessageSquare, Sparkles, Layout, Globe, Smartphone, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateWidgetConfig } from "@/app/actions/settings"
import WidgetPreview from "@/components/widget/preview"
import { cn } from "@/lib/utils"

export default function WidgetPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(true)
  const [previewView, setPreviewView] = useState<"start" | "form" | "chat">("start")
  const [previewOpen, setPreviewOpen] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [config, setConfig] = useState({ color: "#c65f39", greeting: "Hi! How can I help you today? ✨" })

  useEffect(() => {
    setOrigin(window.location.origin)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const wid = user?.app_metadata?.workspace_id as string
      if (wid) {
        setWorkspaceId(wid)
        supabase.from("widget_config").select("accent_color, greeting").eq("workspace_id", wid).maybeSingle().then(({ data }) => {
          if (data) {
            setConfig({ color: data.accent_color || "#c65f39", greeting: data.greeting || "Hi! How can I help you today? ✨" })
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
      toast.success("Widget configuration saved")
    }
  }, [workspaceId, config])

  const copyCode = () => {
    navigator.clipboard.writeText(`<script src="${origin}/widget/widget.js" data-workspace="${workspaceId || "YOUR_WORKSPACE_ID"}" async></script>`)
    setCopied(true)
    toast.success("Snippet copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-[#c65f39] border-orange-100 rounded-lg px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider">
              Engagement
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Web Widget</h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Customize and deploy your AI-powered chat interface to any website with a single line of code.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <Button
            variant="outline"
            className="h-11 rounded-xl text-xs font-semibold gap-2 border-gray-100 hover:bg-gray-50 px-5"
            onClick={() => setPreview(!preview)}
          >
            <Eye className="h-4 w-4" /> {preview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !workspaceId}
            className="h-11 rounded-xl text-xs font-bold gap-2 bg-[#c65f39] hover:bg-[#b55533] px-8 shadow-lg shadow-[#c65f39]/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Column */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Style Section */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
               <Palette className="w-24 h-24 text-[#c65f39]" />
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#c65f39]">
                <Palette className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Identity & Style</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Accent Color</Label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm">
                  <div className="relative group cursor-pointer">
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => setConfig({ ...config, color: e.target.value })}
                      className="h-12 w-12 rounded-xl border-none p-0 bg-transparent cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-gray-100/50"
                    />
                  </div>
                  <div className="flex-1">
                     <p className="text-[13px] font-bold text-gray-900 font-mono uppercase tracking-tight">{config.color}</p>
                     <p className="text-[10px] text-gray-400 font-medium">Used for primary actions and highlights</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Welcome Greeting</Label>
                <textarea
                  value={config.greeting}
                  onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                  placeholder="e.g. Hi there! How can I help you today?"
                  rows={3}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-[13px] font-medium outline-none resize-none transition-all focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10"
                />
                <p className="text-[10px] text-gray-400 font-medium ml-1">The first message users see when they open the widget.</p>
              </div>
            </div>
          </Card>

          {/* Implementation Section */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
               <Code className="w-24 h-24 text-[#c65f39]" />
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Code className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Implementation</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-5 rounded-2xl bg-gray-900 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <Badge className="bg-white/10 text-white/80 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">JavaScript</Badge>
                  <button
                    onClick={copyCode}
                    className="text-[10px] font-bold text-white flex items-center gap-1.5 hover:text-[#c65f39] transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy Snippet"}
                  </button>
                </div>
                <code
                  suppressHydrationWarning
                  className="block text-[11px] text-gray-300 font-mono leading-relaxed break-all opacity-80"
                >
                  {`<script src="${origin}/widget/widget.js" data-workspace="${workspaceId || "YOUR_WORKSPACE_ID"}" async></script>`}
                </code>
              </div>

              <div className="space-y-3">
                 <div className="flex items-start gap-2 text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-[#c65f39]" />
                    <p className="text-[11px] font-medium leading-normal">
                      Paste this script tag just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag of your website.
                    </p>
                 </div>
                 <div className="flex items-start gap-2 text-gray-500">
                    <Globe className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
                    <p className="text-[11px] font-medium leading-normal">
                      Works with WordPress, Webflow, Shopify, or any custom HTML site.
                    </p>
                 </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           <div className={cn(
             "bg-gray-50 rounded-[3rem] border border-gray-100 p-12 md:p-20 flex items-center justify-center relative min-h-[680px] overflow-hidden transition-all duration-700",
             preview ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none grayscale"
           )}>
             {/* Decorative Background for Preview */}
             <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px]" />
             <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[100px]" />

             <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 rounded-full bg-white/80 border border-gray-100 backdrop-blur-xl shadow-sm z-20">
                <button 
                  onClick={() => setPreviewView("start")}
                  className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", previewView === 'start' ? "text-[#c65f39]" : "text-gray-400")}
                >
                  Start
                </button>
                <div className="w-px h-3 bg-gray-200" />
                <button 
                  onClick={() => setPreviewView("form")}
                  className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", previewView === 'form' ? "text-[#c65f39]" : "text-gray-400")}
                >
                  Form
                </button>
                <div className="w-px h-3 bg-gray-200" />
                <button 
                  onClick={() => setPreviewView("chat")}
                  className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", previewView === 'chat' ? "text-[#c65f39]" : "text-gray-400")}
                >
                  Chat
                </button>
                <div className="w-px h-3 bg-gray-200" />
                <button 
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", !previewOpen ? "text-[#c65f39]" : "text-gray-400")}
                >
                  {previewOpen ? "Open" : "Closed"}
                </button>
             </div>

            {workspaceId && preview ? (
              <div className="relative z-10 w-full flex justify-center">
                 <WidgetPreview 
                    workspaceId={workspaceId} 
                    accentColor={config.color} 
                    greeting={config.greeting} 
                    view={previewView}
                    isOpen={previewOpen}
                 />
              </div>
            ) : (
              <div className="text-center space-y-4 relative z-10">
                <div className="h-20 w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mx-auto border border-gray-50">
                  <MessageSquare className="w-8 h-8 text-gray-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Interactive Preview</p>
                  <p className="text-xs text-gray-400 font-medium">Click &quot;Show Preview&quot; to test the live chat widget.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6 text-gray-400 opacity-60">
             <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">TLS 1.3 SECURE</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">AI ACTIVATED</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
