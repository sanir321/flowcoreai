"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, FileText, Globe, Trash2, Database, Loader2, RefreshCw,
  Upload, Link as LinkIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { addUrlSource, deleteSource, pasteKbText } from "@/app/actions/knowledge"
import { useRouter } from "next/navigation"

const supabase = createClient()

interface Source {
  id: string; label: string; source_type: string; status: string; chunk_count?: number
  created_at: string; error_message?: string | null
}

interface SourcesTabProps {
  initialSources: Source[]
  workspaceId: string
}

export function SourcesTab({ initialSources, workspaceId }: SourcesTabProps) {
  const router = useRouter()
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url')
  const [newUrl, setNewUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pasteContent, setPasteContent] = useState("")
  const [pasteTag, setPasteTag] = useState("")

  const refreshSources = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const { data } = await supabase
        .from("kb_sources").select("*").eq("workspace_id", workspaceId)
        .is("deleted_at", null).order("created_at", { ascending: false })
      if (data) setSources(data)
    } catch { toast.error("Failed to load sources") }
    finally { setIsRefreshing(false) }
  }, [workspaceId])

  const hasInProgress = sources.some(s => s.status === 'pending' || s.status === 'processing')
  useEffect(() => {
    if (hasInProgress) { const i = setInterval(refreshSources, 5000); return () => clearInterval(i) }
  }, [hasInProgress, refreshSources])

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
      else { toast.success("Text saved"); setPasteContent(""); setPasteTag(""); setOpen(false); router.refresh(); setTimeout(async () => { await refreshSources(); setIsAdding(false) }, 2000) }
    } catch (err: any) { toast.error(err.message); setIsAdding(false) }
  }

  const handleDelete = async (id: string) => {
    const r = await deleteSource(id)
    if (r.error) toast.error(r.error)
    else { toast.success("Source removed"); await refreshSources() }
  }

  const activeCount = sources.filter(s => s.status === 'active').length
  const failedCount = sources.filter(s => s.status === 'failed').length
  const processingCount = sources.filter(s => s.status === 'pending' || s.status === 'processing').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Sources ({sources.length})</h2>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {activeCount} active</span>
            {processingCount > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> {processingCount} processing</span>}
            {failedCount > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {failedCount} failed</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refreshSources} disabled={isRefreshing} className="h-9 w-9 rounded-xl border-gray-200 text-gray-400 hover:text-gray-900">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button className="h-9 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-semibold gap-2">
                <Plus className="h-4 w-4" /> Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-2xl sm:max-w-md p-6 border-gray-100 shadow-xl">
              <DialogHeader className="space-y-1 pb-4 border-b border-gray-50">
                <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">Add Knowledge</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">Link a website, upload a document, or paste text.</DialogDescription>
              </DialogHeader>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1 mt-4">
                {(['url', 'file', 'paste'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize",
                      activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >{tab === 'url' ? <Globe className="h-3.5 w-3.5 inline mr-1" /> : tab === 'file' ? <Upload className="h-3.5 w-3.5 inline mr-1" /> : <FileText className="h-3.5 w-3.5 inline mr-1" />}
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

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No sources yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">Add a website, upload a document, or paste text.</p>
          <Button onClick={() => setOpen(true)} className="mt-4 h-9 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-semibold">
            <Plus className="h-4 w-4 mr-1" /> Add Source
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map(source => (
              <div key={source.id} className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-5">
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300">
                  {source.source_type === 'url' ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <button onClick={() => handleDelete(source.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 truncate">{source.label}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{source.source_type}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full",
                    source.status === 'active' ? "bg-emerald-500" : source.status === 'processing' ? "bg-amber-500 animate-pulse" : source.status === 'failed' ? "bg-red-500" : "bg-gray-300")} />
                  <span className={cn("text-xs font-medium",
                    source.status === 'active' ? "text-emerald-600" : source.status === 'failed' ? "text-red-600" : source.status === 'processing' ? "text-amber-600" : "text-gray-500")}>
                    {source.status === 'active' ? 'Ready' : source.status === 'failed' ? 'Failed' : source.status === 'processing' ? 'Processing...' : 'Pending'}
                  </span>
                </div>
                {source.chunk_count != null && source.chunk_count > 0 && (
                  <span className="text-[11px] text-gray-400">{source.chunk_count} chunks</span>
                )}
                {source.error_message && (
                  <span className="text-[10px] text-red-400 truncate ml-2" title={source.error_message}>{source.error_message}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
