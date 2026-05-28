"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  FileText, 
  Globe, 
  CheckCircle2, 
  Trash2,
  Database,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { addUrlSource, deleteSource } from "@/app/actions/knowledge"
import { useRouter } from "next/navigation"

const supabase = createClient()

interface Source {
  id: string
  label: string
  source_type: string
  status: string
  metadata?: any
  created_at: string
}

export function KnowledgeClient({ initialSources, workspaceId }: { initialSources: Source[], workspaceId: string }) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const refreshSources = async () => {
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase
        .from("kb_sources")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setSources(data || [])
      router.refresh()
    } catch (err) {
      console.error("Fetch sources error:", err)
      toast.error("Failed to load knowledge sources")
    } finally {
      setIsRefreshing(false)
    }
  }

  const hasInProgress = sources.some(s => s.status === 'pending' || s.status === 'processing')

  useEffect(() => {
    if (hasInProgress) {
      const interval = setInterval(refreshSources, 5000)
      return () => clearInterval(interval)
    }
  }, [hasInProgress])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !workspaceId) return

    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 25 * 1024 * 1024 // 25MB

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF, TXT, MD, and DOCX files are supported")
      return
    }
    if (selectedFile.size > maxSize) {
      toast.error("File size must be under 25MB")
      return
    }

    setIsAdding(true)
    try {
      const fileExt = (selectedFile.name.split('.').pop() || '').toLowerCase()
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
      const storagePath = `${workspaceId}/${fileName}`
      const validTypes = ['pdf', 'txt', 'docx']
      const sourceType = validTypes.includes(fileExt) ? fileExt : 'txt'

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kb-documents')
        .upload(storagePath, selectedFile)

      if (uploadError) throw uploadError

      // 2. Create Source and trigger ingestion
      const result = await addUrlSource({
        workspace_id: workspaceId,
        label: selectedFile.name,
        source_type: sourceType,
        storage_path: storagePath
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Document added")
        setSelectedFile(null)
        setOpen(false)
        router.refresh()
        setTimeout(async () => {
            await refreshSources()
            setIsAdding(false)
        }, 2000)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "File upload failed")
      setIsAdding(false)
    }
  }

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim() || !workspaceId) return
    
    setIsAdding(true)
    try {
      const result = await addUrlSource({
        workspace_id: workspaceId,
        url: newUrl,
        label: new URL(newUrl).hostname,
        source_type: 'url'
      })

      if (result.error) {
        toast.error(result.error)
        setIsAdding(false)
      } else {
        toast.success("Source added")
        setNewUrl("")
        setOpen(false)
        router.refresh()
        setTimeout(async () => {
            await refreshSources()
            setIsAdding(false)
        }, 2000)
      }
    } catch (err) {
      toast.error("Invalid URL format")
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!workspaceId) return
    try {
      const result = await deleteSource(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Source removed")
        await refreshSources()
      }
    } catch (err) {
      toast.error("Delete failed")
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans pb-16 space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Knowledge</h1>
           <p className="text-sm text-gray-500 mt-1">Train your automated assistants with business information.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshSources} 
                disabled={isRefreshing}
                className="h-9 w-9 rounded-xl border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all"
            >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger 
                    render={
                        <Button 
                            className="h-9 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-semibold gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    }
                />
                <DialogContent className="bg-white rounded-2xl sm:max-w-md p-6 border-gray-100 shadow-xl font-sans text-gray-900">
                    <DialogHeader className="space-y-1 pb-4 border-b border-gray-50">
                        <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">Add Knowledge</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">Link a website or upload a document.</DialogDescription>
                    </DialogHeader>
                    <div className="flex p-1 bg-gray-100 rounded-xl gap-1 mt-4">
                        <button 
                            onClick={() => setActiveTab('url')}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all",
                                activeTab === 'url' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Website
                        </button>
                        <button 
                            onClick={() => setActiveTab('file')}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all",
                                activeTab === 'file' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Document
                        </button>
                    </div>
                    {activeTab === 'url' ? (
                        <form onSubmit={handleAddUrl} className="mt-6 space-y-4">
                            <Input 
                                placeholder="https://yourwebsite.com" 
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white text-sm"
                            />
                            <Button type="submit" disabled={isAdding || !newUrl} className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Source"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleFileUpload} className="mt-6 space-y-4">
                            <div className="group relative">
                                <input 
                                    type="file" 
                                    accept=".pdf,.txt,.docx"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={cn(
                                    "h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all",
                                    selectedFile ? "border-black bg-black/5" : "border-gray-200 bg-gray-50 group-hover:border-gray-300"
                                )}>
                                    <FileText className={cn("h-5 w-5", selectedFile ? "text-black" : "text-gray-300")} />
                                    <p className={cn("text-xs font-medium", selectedFile ? "text-black" : "text-gray-400")}>
                                        {selectedFile ? selectedFile.name : "Choose File"}
                                    </p>
                                    <p className="text-[10px] text-gray-400">PDF, TXT or DOCX</p>
                                </div>
                            </div>
                            <Button type="submit" disabled={isAdding || !selectedFile} className="w-full h-11 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No sources yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">Add a website URL or upload a document to train your assistants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sources.map((source) => (
                <div key={source.id} className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-5">
                        <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300">
                            {source.source_type === 'url' ? <Globe className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <button 
                            onClick={() => handleDelete(source.id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="mb-5">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{source.label || source.metadata?.url}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{source.source_type}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                source.status === 'active' ? "bg-emerald-500" : 
                                source.status === 'processing' ? "bg-amber-500 animate-pulse" :
                                source.status === 'failed' ? "bg-red-500" : "bg-gray-300"
                            )} />
                            <span className={cn(
                                "text-xs font-medium",
                                source.status === 'active' ? "text-emerald-600" : 
                                source.status === 'processing' ? "text-amber-600" :
                                source.status === 'failed' ? "text-red-600" : "text-gray-500"
                            )}>
                                {source.status === 'active' ? 'Ready' : source.status === 'failed' ? 'Failed' : source.status === 'processing' ? 'Processing...' : 'Pending'}
                            </span>
                        </div>
                        <div className="flex-1 max-w-[100px] ml-4">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000", 
                                        source.status === 'active' ? "bg-emerald-500" : 
                                        source.status === 'processing' ? "bg-amber-400" :
                                        source.status === 'failed' ? "bg-red-400" : "bg-gray-200"
                                    )} 
                                    style={{ width: source.status === 'active' ? '100%' : source.status === 'processing' ? '65%' : source.status === 'failed' ? '100%' : '15%' }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}
