"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Palette, Code, Check, Copy, Eye, Loader2, Save, 
  MessageSquare, Sparkles, Layout, Globe, Smartphone, 
  ShieldCheck, Trash2, Link2, Monitor, Bell, Bot,
  Settings, UserCog, ExternalLink, ChevronRight,
  Plus, MoreHorizontal, Info
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  const [previewView, setPreviewView] = useState<"start" | "form" | "chat">("start")
  const [previewOpen, setPreviewOpen] = useState(true)

  // Configuration State
  const [config, setConfig] = useState({
    header_text: "FlowCore",
    agent_name: "Support AI",
    greeting: "Hi there, how can we help?",
    post_form_message: "Thank you for filling out the form. Feel free to add any more info while we connect you with the right person!",
    accent_color: "#000000",
    launcher_color: "#000000",
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
              agent_name: d.agent_name || "Support AI",
              greeting: d.greeting || "Hi there, how can we help?",
              post_form_message: d.post_form_message || "Thank you for filling out the form. Feel free to add any more info while we connect you with the right person!",
              accent_color: d.accent_color || "#000000",
              launcher_color: d.accent_color || "#000000", // Default to accent color
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
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden">
        
        {/* LEFT COLUMN: Scrollable Settings (55%) */}
        <div className="w-[55%] h-full overflow-y-auto border-r border-gray-100 scrollbar-none">
          <div className="max-w-[640px] ml-auto mr-12 py-16 space-y-16">
            
            {/* Header Info */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                  <span>Chat Widget</span>
                  <span>&gt;</span>
                  <span className="text-gray-900">{config.agent_name}</span>
               </div>
               <h1 className="text-3xl font-bold tracking-tight text-gray-900">{config.agent_name}</h1>
               <p className="text-gray-500 text-sm">Customize the settings of your widget and connect it to your site</p>
            </div>

            {/* 1. DESIGN */}
            <section className="space-y-10">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">1. Design</h2>
                  <p className="text-[13px] text-gray-500">Customize the appearance of your widget</p>
               </div>

               <div className="space-y-8">
                  {/* Header Input */}
                  <div className="space-y-2">
                     <Label className="text-sm font-semibold text-gray-800">Header</Label>
                     <p className="text-[12px] text-gray-400 mb-2">The heading of your widget</p>
                     <input 
                        value={config.header_text}
                        onChange={e => setConfig({ ...config, header_text: e.target.value })}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm font-medium" 
                     />
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                     <Label className="text-sm font-semibold text-gray-800">Name</Label>
                     <p className="text-[12px] text-gray-400 mb-2">The name of your assistant</p>
                     <input 
                        value={config.agent_name}
                        onChange={e => setConfig({ ...config, agent_name: e.target.value })}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm font-medium" 
                     />
                  </div>

                  {/* Greeting Input */}
                  <div className="space-y-2">
                     <Label className="text-sm font-semibold text-gray-800">Greeting</Label>
                     <p className="text-[12px] text-gray-400 mb-2">The initial message shown when the widget opens</p>
                     <textarea 
                        value={config.greeting}
                        onChange={e => setConfig({ ...config, greeting: e.target.value })}
                        rows={3}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm font-medium resize-none" 
                     />
                  </div>

                  {/* Post Form Message */}
                  <div className="space-y-2">
                     <Label className="text-sm font-semibold text-gray-800">Post Form Message</Label>
                     <p className="text-[12px] text-gray-400 mb-2">Shown after the user submits the form</p>
                     <textarea 
                        value={config.post_form_message}
                        onChange={e => setConfig({ ...config, post_form_message: e.target.value })}
                        rows={3}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm font-medium resize-none" 
                     />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                     <Label className="text-sm font-semibold text-gray-800">Logo</Label>
                     <p className="text-[12px] text-gray-400 mb-4">Recommended size is 256×256 px</p>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-600 border border-gray-100 flex items-center justify-center shadow-inner" />
                        <Button variant="outline" className="h-9 rounded-lg text-xs font-bold border-gray-200 hover:bg-gray-50 px-4">Change logo</Button>
                     </div>
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-2 pt-2">
                     <Label className="text-sm font-semibold text-gray-800">Color</Label>
                     <p className="text-[12px] text-gray-400 mb-4">Customize the inbound message bubble color</p>
                     <div className="flex items-center gap-3">
                        <input 
                           type="color" 
                           value={config.accent_color}
                           onChange={e => setConfig({ ...config, accent_color: e.target.value })}
                           className="w-8 h-8 rounded-lg border-none p-0 cursor-pointer shadow-sm" 
                        />
                        <code className="text-xs font-bold text-gray-400 uppercase">{config.accent_color}</code>
                     </div>
                  </div>

                  {/* Launcher Customization */}
                  <div className="space-y-2 pt-2">
                     <Label className="text-sm font-semibold text-gray-800">Widget Launcher</Label>
                     <p className="text-[12px] text-gray-400 mb-4">Customize the color and icon of the launch button</p>
                     <div className="flex items-center gap-3">
                        <input 
                           type="color" 
                           value={config.launcher_color}
                           onChange={e => setConfig({ ...config, launcher_color: e.target.value })}
                           className="w-8 h-8 rounded-lg border-none p-0 cursor-pointer shadow-sm" 
                        />
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white cursor-pointer shadow-sm">
                           <MessageSquare className="w-4 h-4 fill-current" />
                        </div>
                     </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-6 pt-4">
                     <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                           <Label className="text-sm font-semibold text-gray-900">Enable WhatsApp</Label>
                           <p className="text-[12px] text-gray-400 max-w-xs">Give users the option to message your WhatsApp</p>
                        </div>
                        <Switch checked={config.enable_whatsapp} onCheckedChange={val => setConfig({ ...config, enable_whatsapp: val })} />
                     </div>

                     <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                           <Label className="text-sm font-semibold text-gray-900">Allow anonymous conversations</Label>
                           <p className="text-[12px] text-gray-400 max-w-xs">Skip the contact form and let users start chatting immediately</p>
                        </div>
                        <Switch checked={config.allow_anonymous} onCheckedChange={val => setConfig({ ...config, allow_anonymous: val })} />
                     </div>

                     <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                           <Label className="text-sm font-semibold text-gray-900">Auto-insert form fill params on links</Label>
                           <p className="text-[12px] text-gray-400 max-w-[280px]">Append UTM and collected form values to links clicked in the widget</p>
                           <code className="text-[10px] text-[#c65f39] font-mono mt-1 block">?utm_source=widget&name=John&email=john@example.com</code>
                        </div>
                        <Switch checked={config.auto_fill_params} onCheckedChange={val => setConfig({ ...config, auto_fill_params: val })} />
                     </div>
                  </div>

                  {/* Default Country */}
                  <div className="space-y-2 pt-4">
                     <Label className="text-sm font-semibold text-gray-800">Default Country</Label>
                     <p className="text-[12px] text-gray-400 mb-4">Default country code for phone number input</p>
                     <Select 
                        value={config.default_country} 
                        onValueChange={val => setConfig({ ...config, default_country: val })}
                     >
                        <SelectTrigger className="w-full h-11 bg-white border-gray-200 rounded-xl max-w-sm">
                           <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="IN">India (+91)</SelectItem>
                           <SelectItem value="US">United States (+1)</SelectItem>
                           <SelectItem value="GB">United Kingdom (+44)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 2. USER OPTIONS */}
            <section className="space-y-6">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">2. User Options</h2>
                  <p className="text-[13px] text-gray-500">Additional options for users to choose from</p>
               </div>
               <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                  <p className="text-xs text-gray-300 font-medium italic">Drag and drop to reorder routes. Routes are shown in order from top to bottom.</p>
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 3. ADD TO WEBSITE */}
            <section className="space-y-8">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">3. Add to your website</h2>
                  <p className="text-[13px] text-gray-500">Connect the widget on your site. Make sure you have access to your site settings.</p>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-fit">
                     <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-xs font-bold text-gray-900">HTML</button>
                     <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Google Tag Manager</button>
                  </div>

                  <div className="space-y-4">
                     <p className="text-xs font-semibold text-gray-600">Add the following code snippet right before the <code className="text-gray-400 font-bold">&lt;/head&gt;</code> tag</p>
                     <div className="p-8 bg-[#1a1a1a] rounded-2xl relative group">
                        <button 
                           onClick={() => copySnippet('html')}
                           className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
                        >
                           {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <code className="text-[11px] text-gray-400 font-mono leading-relaxed break-all">
                           {`<script async\n  data-workspace="${workspaceId || "..."}"\n  src="${origin}/widget/widget.js">\n</script>`}
                        </code>
                     </div>
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1" className="border-none">
                      <AccordionTrigger className="text-[13px] font-bold text-gray-900 hover:no-underline py-2">
                         Pre-fill contact info on authenticated pages (optional)
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-gray-500 leading-relaxed pt-2">
                         You can automatically identify users by setting window.FlowCoreConfig.user before the script loads.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 4. PROGRAMMATIC API */}
            <section className="space-y-8">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">4. Programmatic API</h2>
                  <p className="text-[13px] text-gray-500 max-w-sm">Control the widget from your own code. These methods are available on <code className="font-bold">window.FlowCoreSettings</code> after the widget loads.</p>
               </div>

               <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                     <p className="text-sm font-bold text-gray-900">expand()</p>
                     <p className="text-xs text-gray-400 mt-1">Open the chat window</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-gray-900">hide()</p>
                     <p className="text-xs text-gray-400 mt-1">Hide the widget entirely</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-gray-900">collapse()</p>
                     <p className="text-xs text-gray-400 mt-1">Close the chat window</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-gray-900">show()</p>
                     <p className="text-xs text-gray-400 mt-1">Show the widget after hiding</p>
                  </div>
               </div>

               <div className="p-8 bg-[#1a1a1a] rounded-2xl relative group overflow-hidden">
                  <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2">
                     <Copy className="w-4 h-4" />
                  </button>
                  <code className="text-[11px] text-gray-400 font-mono leading-relaxed block">
                     {`// Open chat when a CTA button is clicked\ndocument.querySelector("#contact-us").addEventListener("click", () => {\n  window.FlowCoreSettings.expand();\n});`}
                  </code>
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 5. TRUSTED DOMAINS */}
            <section className="space-y-6">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">5. Trusted Domains</h2>
                  <p className="text-[13px] text-gray-500 max-w-md">In addition to your main company website, you can make sure this widget shows up on other domains.</p>
               </div>

               <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-800">Domains</Label>
                  <div className="h-14 w-full bg-white border-2 border-red-50 rounded-xl flex items-center px-4 focus-within:border-[#c65f39] transition-all">
                     <input 
                        value={config.trusted_domains}
                        onChange={e => setConfig({ ...config, trusted_domains: e.target.value })}
                        placeholder="flowcore.app, yourdomain.com"
                        className="bg-transparent border-none outline-none text-sm w-full font-medium" 
                     />
                  </div>
                  <p className="text-[11px] text-gray-400 italic">List domains and subdomains, separated by commas. Use *.example.com for all subdomains. Leave blank to allow any domain.</p>
               </div>
            </section>

            <hr className="border-gray-100" />

            {/* 6. EMAIL NOTIFICATIONS */}
            <section className="space-y-8 pb-32">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-900">6. Email Notifications</h2>
                  <p className="text-[13px] text-gray-500">Send an email to offline users when they receive a reply</p>
               </div>

               <div className="flex items-center justify-between group">
                  <div className="space-y-1">
                     <Label className="text-sm font-semibold text-gray-900">Enable email notifications</Label>
                     <p className="text-[12px] text-gray-400 max-w-xs">When a user leaves the widget, email them new replies so they can continue the conversation</p>
                  </div>
                  <Switch checked={config.email_notifications} onCheckedChange={val => setConfig({ ...config, email_notifications: val })} />
               </div>

               <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base shadow-xl shadow-black/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
               >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Saving Configuration..." : "Save Changes"}
               </Button>
            </section>

          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Preview (45%) */}
        <div className="w-[45%] h-full bg-[#f9fafb] border-l border-gray-100 flex flex-col items-center justify-center relative">
           {/* Preview Controller Bar */}
           <div className="absolute top-12 flex items-center gap-10">
              <div className="flex items-center gap-4">
                 <span className="text-[13px] font-bold text-gray-900">Preview:</span>
                 <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                    <button 
                      onClick={() => setPreviewView("start")}
                      className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", previewView === 'start' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                    >Start</button>
                    <button 
                      onClick={() => setPreviewView("form")}
                      className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", previewView === 'form' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                    >Form</button>
                    <button 
                      onClick={() => setPreviewView("chat")}
                      className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", previewView === 'chat' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                    >Chat</button>
                 </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                 <button 
                  onClick={() => setPreviewOpen(true)}
                  className={cn("px-5 py-1.5 rounded-lg text-xs font-bold transition-all", previewOpen ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-gray-600")}
                 >Open</button>
                 <button 
                  onClick={() => setPreviewOpen(false)}
                  className={cn("px-5 py-1.5 rounded-lg text-xs font-bold transition-all", !previewOpen ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-gray-600")}
                 >Closed</button>
              </div>
           </div>

           {/* The Preview Widget */}
           <div className="w-full flex justify-center mt-10 scale-[1.05] origin-center">
              <WidgetPreview 
                view={previewView} 
                isOpen={previewOpen} 
                workspaceId={workspaceId || ""}
                config={{
                   ...config,
                   logo_url: null
                }}
              />
           </div>

           {/* Website Background Simulation */}
           <div className="absolute inset-0 opacity-[0.4] pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

      </div>
    </div>
  )
}
