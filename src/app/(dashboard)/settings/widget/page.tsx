"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Palette, Code, Check, Copy, Eye, Loader2, Save, 
  ShieldCheck, Settings, Upload, Trash2, Image,
  MessageCircle, Mail, Headphones, MessageSquare
} from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/use-workspace"
import { updateWidgetConfig } from "@/app/actions/settings"
import WidgetPreview from "@/components/widget/preview"
import type { WidgetConfig } from "@/components/widget/preview"
import { cn } from "@/lib/utils"

const LAUNCHER_ICONS: { key: string; label: string; Icon: React.ElementType }[] = [
  { key: "chat", label: "Chat Bubble", Icon: MessageCircle },
  { key: "message", label: "Message", Icon: Mail },
  { key: "support", label: "Headset", Icon: Headphones },
  { key: "comment", label: "Comment", Icon: MessageSquare },
  { key: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp }
]

export default function WidgetSettingsPage() {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)
  const { workspaceId } = useWorkspace()
  
  // Preview Controls
  const [previewView, setPreviewView] = useState<"form" | "chat">("form")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Logo Upload
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configuration State (All new features included)
  const [config, setConfig] = useState({
    header_text: "Flowcore",
    agent_name: "Assistant",
    greeting: "Hi! How can I help?",
    post_form_message: "Thank you! How can I help you today?",
    accent_color: "#050505",
    theme: "dark" as "light" | "dark" | "auto",
    launcher_icon: "chat",
    allow_anonymous: false,
    auto_fill_params: false,
    trusted_domains: "",
    email_notifications: false,
    is_active: true,
    logo_url: ""
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!workspaceId) return
    let aborted = false
    const supabase = createClient()
    supabase.from("widget_config").select("*").eq("workspace_id", workspaceId).maybeSingle().then(({ data: d2 }) => {
      if (aborted) return
      if (d2) {
        const d = d2 as Record<string, unknown>
        setConfig({
          header_text: (d.header_text as string) || "Flowcore",
          agent_name: (d.agent_name as string) || "Assistant",
          greeting: (d.greeting as string) || "Hi! How can I help?",
          post_form_message: (d.post_form_message as string) || "Thank you! How can I help you today?",
          accent_color: (d.accent_color as string) || "#050505",
          theme: (d.theme as "light" | "dark" | "auto") || "dark",
          launcher_icon: (d.launcher_icon as string) || "chat",
          allow_anonymous: (d.allow_anonymous as boolean) || false,
          auto_fill_params: (d.auto_fill_params as boolean) || false,
          trusted_domains: ((d.allowed_domains as string[])?.join(", ")) || "",
          email_notifications: (d.email_notifications as boolean) || false,
          is_active: d.is_active !== false,
          logo_url: (d.logo_url as string) || ""
        })
      }
    })
    return () => { aborted = true }
  }, [workspaceId])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !workspaceId) return
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    if (file.size > 2 * 1024 * 1024) { toast.error("File too large — max 2MB"); return }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() || "png"
      const path = `${workspaceId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("widget-logos")
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from("widget-logos")
        .getPublicUrl(path)
      setConfig(c => ({ ...c, logo_url: publicUrl }))
      toast.success("Logo uploaded")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveLogo = async () => {
    if (!workspaceId || !config.logo_url) return
    setConfig(c => ({ ...c, logo_url: "" }))
    toast.success("Logo removed — save to confirm")
  }

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
           <Button onClick={handleSave} disabled={saving || !workspaceId} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl h-10 px-6 text-sm font-semibold transition-all active:scale-[0.98] gap-2">
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
                <Label className="text-xs font-semibold text-gray-700 ml-1">Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "auto"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setConfig({...config, theme: t})}
                      className={cn(
                        "py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all",
                        config.theme === t
                          ? "border-[#f9510b] bg-[#f9510b]/5 text-[#f9510b]"
                          : "border-gray-100 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      {t === "light" ? "☀ Light" : t === "dark" ? "☾ Dark" : "◐ Auto"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 italic ml-1">Auto follows the visitor's OS preference.</p>
              </div>

              <div className="space-y-1.5">
                 <Label className="text-xs font-semibold text-gray-700 ml-1">Welcome Message</Label>
                 <Textarea
                    value={config.greeting}
                    onChange={(e) => setConfig({...config, greeting: e.target.value})}
                    rows={3}
                    className="rounded-xl border-gray-200 text-sm resize-none focus:border-gray-400 transition-all"
                 />
               </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Logo / Brand Icon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[14px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                    {config.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={config.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg text-xs font-medium border-gray-200"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                    {config.logo_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg text-xs font-medium border-red-200 text-red-500 hover:bg-red-50"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-[11px] text-gray-400 italic ml-1">Upload a square PNG or JPG, max 2MB. Shows in widget header.</p>
              </div>

              {/* Launcher Icon Picker */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-700 ml-1">Launcher Icon</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {LAUNCHER_ICONS.map(icon => {
                    const IconComp = icon.Icon
                    return (
                      <button
                        key={icon.key}
                        type="button"
                        onClick={() => setConfig({...config, launcher_icon: icon.key})}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          config.launcher_icon === icon.key
                            ? "border-[#f9510b] bg-[#f9510b]/5"
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ color: config.launcher_icon === icon.key ? "#f9510b" : "#666" }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 leading-tight text-center">{icon.label}</span>
                      </button>
                    )
                  })}
                </div>
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
                    <Label className="text-sm font-bold text-gray-800">Widget Active</Label>
                    <p className="text-[11px] text-gray-400">Show the widget on your website. Disable to hide it completely.</p>
                  </div>
                  <Switch checked={config.is_active} onCheckedChange={val => setConfig({...config, is_active: val})} />
               </div>
               <div className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl group hover:bg-gray-50/50 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-gray-800">Anonymous Conversations</Label>
                    <p className="text-[11px] text-gray-400">Skip the lead form and start chatting immediately</p>
                  </div>
                  <Switch checked={config.allow_anonymous} onCheckedChange={val => setConfig({...config, allow_anonymous: val})} />
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
                    config={config as unknown as WidgetConfig}
                  />
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
