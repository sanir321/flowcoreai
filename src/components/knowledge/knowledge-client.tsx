"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, FileText, Globe, CheckCircle2, Trash2, Database, Loader2, RefreshCw,
  ChevronRight, Clock, Link as LinkIcon, Phone, Mail, MapPin, Hash,
  X, Circle, Square, Hotel, Sparkles, PenLine, Upload, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { addUrlSource, deleteSource, pasteKbText } from "@/app/actions/knowledge"
import { updateBusinessProfile } from "@/app/actions/business-profile"
import { useRouter } from "next/navigation"

const supabase = createClient()
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

interface Source {
  id: string; label: string; source_type: string; status: string; chunk_count?: number
  created_at: string; error_message?: string | null
}

interface Template {
  id: string; business_type: string; section: string; field_key: string; priority: number
  label: string; field_type: string; description: string | null; is_required: boolean
}

interface RequiredItem {
  id: string; label: string; description: string | null; section: string
  field_key: string; field_type: string; priority: number; is_required: boolean; status: "complete" | "empty"
}

export function KnowledgeClient({
  initialSources, workspaceId, businessType, initialBusinessProfile, initialTemplates
}: {
  initialSources: Source[]; workspaceId: string; businessType: string
  initialBusinessProfile: any; initialTemplates: Template[]
}) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [businessProfile, setBusinessProfile] = useState(initialBusinessProfile)
  const [templates] = useState(initialTemplates)
  const [requiredItems, setRequiredItems] = useState<RequiredItem[]>([])
  const [progress, setProgress] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pasteContent, setPasteContent] = useState("")
  const [pasteTag, setPasteTag] = useState("")
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url')
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isSavingBP, setIsSavingBP] = useState(false)
  const router = useRouter()

  // --- Helpers ---
  const computeItems = useCallback((bp: any, tmpls: Template[]) => {
    const items: RequiredItem[] = tmpls.map(t => {
      let status: "complete" | "empty" = "empty"
      const fkey = t.field_key
      if (t.section === "business_profile") {
        const extras = (bp?.extras || {}) as Record<string, any>
        let val: any = null
        if (fkey.startsWith("extras.")) val = extras[fkey.replace("extras.", "")]
        else val = bp?.[fkey]
        if (val != null) {
          if (Array.isArray(val)) status = val.length > 0 ? "complete" : "empty"
          else if (typeof val === "object")
            status = Object.values(val as Record<string, any>).some(v => v != null && v !== "") ? "complete" : "empty"
          else if (typeof val === "string") status = val.trim().length > 0 ? "complete" : "empty"
          else status = "complete"
        }
      }
      return {
        id: t.id, label: t.label, description: t.description, section: t.section,
        field_key: t.field_key, field_type: t.field_type, priority: t.priority, is_required: t.is_required, status,
      }
    })
    const completed = items.filter(i => i.status === "complete").length
    const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0
    return { items, progress: pct }
  }, [])

  useEffect(() => {
    const { items, progress: p } = computeItems(businessProfile, templates)
    setRequiredItems(items)
    setProgress(p)
  }, [businessProfile, templates, computeItems])

  // --- Source management ---
  const refreshSources = async () => {
    setIsRefreshing(true)
    try {
      const { data } = await supabase
        .from("kb_sources").select("*").eq("workspace_id", workspaceId)
        .is("deleted_at", null).order("created_at", { ascending: false })
      if (data) setSources(data)
    } catch { toast.error("Failed to load sources") }
    finally { setIsRefreshing(false) }
  }

  const hasInProgress = sources.some(s => s.status === 'pending' || s.status === 'processing')
  useEffect(() => {
    if (hasInProgress) { const i = setInterval(refreshSources, 5000); return () => clearInterval(i) }
  }, [hasInProgress])

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setIsAdding(true)
    try {
      const r = await addUrlSource({ workspace_id: workspaceId, url: newUrl, label: new URL(newUrl).hostname, source_type: 'url' })
      if (r.error) { toast.error(r.error); setIsAdding(false) }
      else { toast.success("Source added"); setNewUrl(""); setOpen(false); router.refresh(); setTimeout(async () => { await refreshSources(); setIsAdding(false) }, 2000) }
    } catch { toast.error("Invalid URL"); setIsAdding(false) }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    const allowed = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(selectedFile.type)) { toast.error("Only PDF, TXT, MD, DOCX supported"); return }
    if (selectedFile.size > 25 * 1024 * 1024) { toast.error("File must be under 25MB"); return }
    setIsAdding(true)
    try {
      const fileExt = (selectedFile.name.split('.').pop() || '').toLowerCase()
      const storagePath = `${workspaceId}/${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('kb-documents').upload(storagePath, selectedFile)
      if (uploadError) throw uploadError
      const r = await addUrlSource({ workspace_id: workspaceId, label: selectedFile.name, source_type: fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'txt' ? fileExt : 'txt', storage_path: storagePath })
      if (r.error) { toast.error(r.error); setIsAdding(false) }
      else { toast.success("Document added"); setSelectedFile(null); setOpen(false); router.refresh(); setTimeout(async () => { await refreshSources(); setIsAdding(false) }, 2000) }
    } catch (err: any) { toast.error(err.message); setIsAdding(false) }
  }

  const handlePasteText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pasteContent.trim()) return
    setIsAdding(true)
    try {
      const r = await pasteKbText({ workspace_id: workspaceId, content: pasteContent, tag: pasteTag || undefined })
      if (r.error) { toast.error(r.error); setIsAdding(false) }
      else { toast.success("Text saved to knowledge base"); setPasteContent(""); setPasteTag(""); setOpen(false); router.refresh(); setTimeout(async () => { await refreshSources(); setIsAdding(false) }, 2000) }
    } catch (err: any) { toast.error(err.message); setIsAdding(false) }
  }

  const handleDelete = async (id: string) => {
    const r = await deleteSource(id)
    if (r.error) toast.error(r.error)
    else { toast.success("Source removed"); await refreshSources() }
  }

  // --- Business Profile editor ---
  const handleSaveBP = async (updates: Record<string, any>) => {
    setIsSavingBP(true)
    try {
      const merged = { ...businessProfile }
      for (const [key, val] of Object.entries(updates)) {
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          merged[key] = { ...(merged[key] || {}), ...val }
        } else {
          merged[key] = val
        }
      }
      const r = await updateBusinessProfile({ workspace_id: workspaceId, profile: merged })
      if (r.error) { toast.error(r.error); return }
      setBusinessProfile(merged)
      toast.success("Saved")
    } catch (err: any) { toast.error(err.message) }
    finally { setIsSavingBP(false) }
  }

  // --- Field editors ---
  const renderFieldEditor = (item: RequiredItem) => {
    const fkey = item.field_key
    const isExtras = fkey.startsWith("extras.")
    const extrasKey = isExtras ? fkey.replace("extras.", "") : null
    const currentVal = isExtras
      ? (businessProfile?.extras || {})[extrasKey!]
      : businessProfile?.[fkey]

    const setField = (val: any) => {
      if (isExtras) {
        handleSaveBP({ extras: { ...(businessProfile?.extras || {}), [extrasKey!]: val } })
      } else {
        handleSaveBP({ [fkey]: val })
      }
    }

    const fieldType = item.field_type

    if (fieldType === "contact") {
      const c = currentVal || {}
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /><Input size={1} placeholder="+91 832 123 4567" value={c.phone || ""} onChange={e => setField({ ...c, phone: e.target.value })} className="h-9 text-sm" /></div>
          <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /><Input size={1} placeholder="email@example.com" value={c.email || ""} onChange={e => setField({ ...c, email: e.target.value })} className="h-9 text-sm" /></div>
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /><Input size={1} placeholder="Full address" value={c.address || ""} onChange={e => setField({ ...c, address: e.target.value })} className="h-9 text-sm" /></div>
          <div className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5 text-gray-400" /><Input size={1} placeholder="Google Maps link" value={c.google_maps_link || ""} onChange={e => setField({ ...c, google_maps_link: e.target.value })} className="h-9 text-sm" /></div>
        </div>
      )
    }

    if (fieldType === "hours") {
      const d = currentVal?.daily || {}
      return (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {DAYS.map(day => {
            const dd = d[day] || { open: "09:00", close: "18:00", closed: false }
            return (
              <div key={day} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="w-20 text-xs font-medium capitalize text-gray-600">{day.slice(0, 3)}</span>
                <button onClick={() => setField({ daily: { ...d, [day]: { ...dd, closed: !dd.closed } } })} className={cn("h-5 w-5 rounded flex items-center justify-center transition-all", dd.closed ? "bg-red-50 text-red-400" : "bg-emerald-50 text-emerald-400")}>
                  {dd.closed ? <X className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                </button>
                {!dd.closed && (
                  <>
                    <Input size={1} type="time" value={dd.open || "09:00"} onChange={e => setField({ daily: { ...d, [day]: { ...dd, open: e.target.value } } })} className="h-8 w-24 text-xs" />
                    <span className="text-xs text-gray-300">—</span>
                    <Input size={1} type="time" value={dd.close || "18:00"} onChange={e => setField({ daily: { ...d, [day]: { ...dd, close: e.target.value } } })} className="h-8 w-24 text-xs" />
                  </>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    if (fieldType === "policies") {
      const p = currentVal || {}
      const [newKey, setNewKey] = useState("")
      const [newVal, setNewVal] = useState("")
      return (
        <div className="space-y-2">
          {Object.entries(p).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input size={1} value={k} onChange={e => {
                  const upd = { ...p } as any
                  delete upd[k]; upd[e.target.value] = v
                  setField(upd)
                }} className="h-8 text-xs font-medium" placeholder="Policy name" />
                <Input size={1} value={v as string} onChange={e => setField({ ...p, [k]: e.target.value })} className="h-8 text-xs" placeholder="Policy value" />
              </div>
              <button onClick={() => { const upd = { ...p }; delete (upd as any)[k]; setField(upd) }} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t border-gray-50">
            <Input size={1} placeholder="New policy" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-8 text-xs flex-1" />
            <Input size={1} placeholder="Value" value={newVal} onChange={e => setNewVal(e.target.value)} className="h-8 text-xs flex-1" />
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { if (newKey.trim()) { setField({ ...p, [newKey.trim()]: newVal }); setNewKey(""); setNewVal("") } }}>Add</Button>
          </div>
        </div>
      )
    }

    if (fieldType === "amenities" || fieldType === "tags") {
      const arr: string[] = currentVal || []
      const [tagInput, setTagInput] = useState("")
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {arr.map((t: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700">
                {t}
                <button onClick={() => setField(arr.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input size={1} placeholder="Add item..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); setField([...arr, tagInput.trim().toLowerCase().replace(/\s+/g, '_')]); setTagInput("") }
            }} className="h-8 text-xs flex-1" />
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { if (tagInput.trim()) { setField([...arr, tagInput.trim().toLowerCase().replace(/\s+/g, '_')]); setTagInput("") } }}>Add</Button>
          </div>
        </div>
      )
    }

    if (fieldType === "pricing") {
      const p = currentVal || {}
      return (
        <div className="space-y-3">
          <Input size={1} placeholder="e.g. Rooms from ₹8,000/night" value={p.description || ""} onChange={e => setField({ ...p, description: e.target.value })} className="h-9 text-sm" />
          <Input size={1} placeholder="INR" value={p.currency || "INR"} onChange={e => setField({ ...p, currency: e.target.value })} className="h-9 text-sm w-24" />
        </div>
      )
    }

    if (fieldType === "rooms") {
      const rooms: any[] = currentVal || []
      return (
        <div className="space-y-2">
          {rooms.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between">
                <Input size={1} placeholder="Room name" value={r.name || ""} onChange={e => { const upd = [...rooms]; upd[i] = { ...upd[i], name: e.target.value }; setField(upd) }} className="h-8 text-sm font-medium" />
                <button onClick={() => setField(rooms.filter((_, j) => j !== i))} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500"><X className="h-3 w-3" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input size={1} type="number" placeholder="Base rate" value={r.base_rate || ""} onChange={e => { const upd = [...rooms]; upd[i] = { ...upd[i], base_rate: Number(e.target.value) }; setField(upd) }} className="h-8 text-xs" />
                <Input size={1} placeholder="Currency" value={r.currency || "INR"} onChange={e => { const upd = [...rooms]; upd[i] = { ...upd[i], currency: e.target.value }; setField(upd) }} className="h-8 text-xs" />
              </div>
              <Textarea placeholder="Description" value={r.description || ""} onChange={e => { const upd = [...rooms]; upd[i] = { ...upd[i], description: e.target.value }; setField(upd) }} className="min-h-[60px] text-xs" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setField([...rooms, { name: "", base_rate: 0, currency: "INR", description: "" }])}>+ Add Room</Button>
        </div>
      )
    }

    if (fieldType === "time") {
      return <Input size={1} type="time" value={currentVal || "14:00"} onChange={e => setField(e.target.value)} className="h-9 w-32 text-sm" />
    }
    if (fieldType === "number") {
      return <Input size={1} type="number" placeholder="Value" value={currentVal ?? ""} onChange={e => setField(Number(e.target.value))} className="h-9 w-32 text-sm" />
    }

    // text / default
    return <Input size={1} placeholder="Enter value" value={currentVal || ""} onChange={e => setField(e.target.value)} className="h-9 text-sm" />
  }

  // --- Sections ---
  const bpItems = requiredItems.filter(i => i.section === "business_profile")
  const kbItems = requiredItems.filter(i => i.section === "knowledge_base")

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Knowledge</h1>
          <p className="text-sm text-gray-500 mt-1">Train your assistants with business info.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={refreshSources} disabled={isRefreshing} className="h-9 w-9 rounded-xl border-gray-200 text-gray-400 hover:text-gray-900">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button className="h-9 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-semibold gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-2xl sm:max-w-md p-6 border-gray-100 shadow-xl font-sans text-gray-900">
              <DialogHeader className="space-y-1 pb-4 border-b border-gray-50">
                <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">Add Knowledge</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">Link a website, upload a document, or paste text.</DialogDescription>
              </DialogHeader>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1 mt-4">
                {(['url', 'file', 'paste'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize",
                      activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >{tab === 'url' ? <Globe className="h-3.5 w-3.5 inline mr-1" /> : tab === 'file' ? <Upload className="h-3.5 w-3.5 inline mr-1" /> : <PenLine className="h-3.5 w-3.5 inline mr-1" />}
                    {tab === 'url' ? 'Website' : tab === 'file' ? 'Document' : 'Paste'}
                  </button>
                ))}
              </div>

              {activeTab === 'url' && (
                <form onSubmit={handleAddUrl} className="mt-6 space-y-4">
                  <Input placeholder="https://yourwebsite.com" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white text-sm" />
                  <Button type="submit" disabled={isAdding || !newUrl} className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add URL"}
                  </Button>
                </form>
              )}

              {activeTab === 'file' && (
                <form onSubmit={handleFileUpload} className="mt-6 space-y-4">
                  <div className="group relative">
                    <input type="file" accept=".pdf,.txt,.docx" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={cn("h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all",
                      selectedFile ? "border-black bg-black/5" : "border-gray-200 bg-gray-50 group-hover:border-gray-300")}>
                      <FileText className={cn("h-5 w-5", selectedFile ? "text-black" : "text-gray-300")} />
                      <p className={cn("text-xs font-medium", selectedFile ? "text-black" : "text-gray-400")}>{selectedFile ? selectedFile.name : "Choose File"}</p>
                      <p className="text-[10px] text-gray-400">PDF, TXT or DOCX</p>
                    </div>
                  </div>
                  <Button type="submit" disabled={isAdding || !selectedFile} className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                  </Button>
                </form>
              )}

              {activeTab === 'paste' && (
                <form onSubmit={handlePasteText} className="mt-6 space-y-4">
                  <Input placeholder="Tag (optional, e.g. 'services')" value={pasteTag} onChange={e => setPasteTag(e.target.value)} className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white text-sm" />
                  <Textarea placeholder="Paste your content here..." value={pasteContent} onChange={e => setPasteContent(e.target.value)} rows={8} className="rounded-xl bg-gray-50 border-gray-100 focus:bg-white text-sm resize-none" />
                  <Button type="submit" disabled={isAdding || !pasteContent.trim()} className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold">
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to Knowledge Base"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sources Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Sources ({sources.length})</h2>
          </div>

          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No sources yet</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">Add a website, upload a document, or paste text.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sources.map(source => (
                <div key={source.id} className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300">
                      {source.source_type === 'url' ? <Globe className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <button onClick={() => handleDelete(source.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{source.label}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{source.source_type}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full",
                        source.status === 'active' ? "bg-emerald-500" : source.status === 'processing' ? "bg-amber-500 animate-pulse" : source.status === 'failed' ? "bg-red-500" : "bg-gray-300")} />
                      <span className={cn("text-xs font-medium",
                        source.status === 'active' ? "text-emerald-600" : source.status === 'processing' ? "text-amber-600" : source.status === 'failed' ? "text-red-600" : "text-gray-500")}>
                        {source.status === 'active' ? 'Ready' : source.status === 'failed' ? 'Failed' : source.status === 'processing' ? 'Processing...' : 'Pending'}
                      </span>
                    </div>
                    {source.error_message && (
                      <span className="text-[10px] text-red-400 truncate ml-2" title={source.error_message}>{source.error_message}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Setup Progress */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Setup Progress</h2>
              <span className="text-xs font-bold text-gray-500">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>

            {/* Business Profile section */}
            <div className="mb-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <Hotel className="h-3 w-3" /> Business Profile
              </h3>
              <div className="space-y-0.5">
                {bpItems.map(item => (
                  <div key={item.id}>
                    <button onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                        selectedItem === item.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600")}>
                      <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        item.status === 'complete' ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                        {item.status === 'complete' && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{item.label}</div>
                      </div>
                      <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", selectedItem === item.id && "rotate-90")} />
                    </button>
                    {/* Inline editor */}
                    {selectedItem === item.id && (
                      <div className="mx-3 mb-2 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        {renderFieldEditor(item)}
                        {isSavingBP && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Base section */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <Database className="h-3 w-3" /> Knowledge Base
              </h3>
              <div className="space-y-0.5">
                {kbItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500">
                    <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      item.status === 'complete' ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                      {item.status === 'complete' && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{item.label}</div>
                    </div>
                  </div>
                ))}
                {kbItems.length > 0 && (
                  <div className="px-3 pt-2">
                    <p className="text-[10px] text-gray-400">Add content via URL, document, or paste above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-extraction status */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <Sparkles className="h-3 w-3" />
                <span>AI extracts structured data from pasted/uploaded content automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
