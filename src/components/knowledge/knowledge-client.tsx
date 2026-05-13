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
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
      const storagePath = `${workspaceId}/${fileName}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('kb-documents')
        .upload(storagePath, selectedFile)

      if (uploadError) throw uploadError

      // 2. Create Source and trigger ingestion
      const result = await addUrlSource({
        workspace_id: workspaceId,
        label: selectedFile.name,
        source_type: 'pdf',
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
    <div className="p-8 max-w-7xl mx-auto font-sans pb-32 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-1">
           <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Knowledge</h1>
           <p className="text-sm text-gray-500 font-medium">Train your automated assistants with business information.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshSources} 
                disabled={isRefreshing}
                className="h-12 w-12 rounded-xl border-gray-200 text-gray-400 hover:text-black transition-all"
            >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger 
                    render={
                        <Button 
                            className="h-12 px-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm active:scale-95 text-xs font-semibold gap-2 inline-flex items-center justify-center cursor-pointer"
                        >
                            <Plus className="h-4 w-4" /> Add Source
                        </Button>
                    }
                />
                <DialogContent className="bg-white rounded-3xl sm:max-w-md p-8 border-gray-100 shadow-2xl overflow-hidden font-sans text-gray-900">
                    <DialogHeader className="space-y-2 pb-6 border-b border-gray-50 text-left">
                        <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Add Knowledge</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 font-medium">Link a website or upload a document.</DialogDescription>
                    </DialogHeader>

                    {/* Tab Switcher */}
                    <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl gap-1 mt-6 shadow-sm">
                        <button 
                            onClick={() => setActiveTab('url')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
                                activeTab === 'url' ? "bg-black text-white shadow-md scale-[1.02]" : "text-gray-500 hover:text-gray-600"
                            )}
                        >
                            <Globe className="h-4 w-4" /> Website
                        </button>
                        <button 
                            onClick={() => setActiveTab('file')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
                                activeTab === 'file' ? "bg-black text-white shadow-md scale-[1.02]" : "text-gray-500 hover:text-gray-600"
                            )}
                        >
                            <FileText className="h-4 w-4" /> Document
                        </button>
                    </div>

                    {activeTab === 'url' ? (
                        <form onSubmit={handleAddUrl} className="space-y-6 mt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-900 ml-1">Website URL</Label>
                                <Input 
                                    placeholder="https://yourwebsite.com" 
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all text-sm"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding || !newUrl} className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Source"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleFileUpload} className="space-y-6 mt-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-900 ml-1">Upload Document</Label>
                                <div className="group relative">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.txt,.docx"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={cn(
                                        "h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
                                        selectedFile ? "border-[#c65f39] bg-[#c65f39]/5" : "border-gray-100 bg-gray-50 group-hover:border-gray-200 group-hover:bg-gray-100/50"
                                    )}>
                                        <FileText className={cn("h-6 w-6", selectedFile ? "text-[#c65f39]" : "text-gray-300")} />
                                        <p className={cn("text-xs font-semibold", selectedFile ? "text-[#c65f39]" : "text-gray-400")}>
                                            {selectedFile ? selectedFile.name : "Choose File"}
                                        </p>
                                        <p className="text-[10px] text-gray-400">PDF, Text or Word</p>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" disabled={isAdding || !selectedFile} className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload File"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-gray-50/30 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
            <div className="h-20 w-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm">
                <Database className="h-8 w-8" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Knowledge Base is Empty</h3>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">Add information to help your assistants provide accurate answers.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sources.map((source) => (
                <div key={source.id} className="p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between h-[280px]">
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500">
                                {source.source_type === 'url' ? <Globe className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <button 
                                onClick={() => handleDelete(source.id)}
                                className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        
                            <div className="space-y-1">
                                <h4 className="text-base font-semibold text-gray-900 truncate tracking-tight">{source.label || source.metadata?.url}</h4>
                                <p className="text-[10px] font-medium text-gray-500 capitalize">{source.source_type}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        source.status === 'active' ? "bg-emerald-500" : 
                                        source.status === 'processing' ? "bg-amber-500 animate-pulse" :
                                        source.status === 'failed' ? "bg-rose-500" : "bg-gray-300"
                                    )} />
                                    <span className="text-[10px] font-semibold text-gray-900 capitalize">{source.status === 'active' ? 'Ready' : source.status}</span>
                                </div>
                            </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div 
                                    className={cn(
                                        "h-full transition-all duration-1000", 
                                        source.status === 'active' ? "bg-emerald-500" : 
                                        source.status === 'processing' ? "bg-amber-400" :
                                        source.status === 'failed' ? "bg-rose-500" : "bg-gray-200"
                                    )} 
                                    style={{ 
                                        width: source.status === 'active' ? '100%' : 
                                               source.status === 'processing' ? '65%' :
                                               source.status === 'failed' ? '100%' : '15%' 
                                    }} 
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
