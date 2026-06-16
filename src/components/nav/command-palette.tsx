"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from "@/components/ui/command"
import { 
  Inbox, 
  Bot, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Settings, 
  Zap, 
  Phone,
  PlusCircle,
  FileUp,
  Loader2
} from "lucide-react"
import { useWorkspace } from "@/hooks/use-workspace"
import { createClient } from "@/lib/supabase/client"
import { uploadDocumentSource } from "@/app/actions/knowledge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const supabase = createClient()

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const { workspaceId } = useWorkspace()
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!workspaceId) {
      toast.error("No active workspace found")
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    if (!file) return

    // Validate file type (PDF/Text)
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, Text, and Markdown files are supported")
      return
    }

    setIsUploading(true)
    const toastId = toast.loading(`Ingesting ${file.name}...`)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const storagePath = `${workspaceId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('kb-documents')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      const result = await uploadDocumentSource({
        workspace_id: workspaceId,
        label: file.name,
        file_name: file.name,
        source_type: fileExt === 'pdf' ? 'pdf' : 'txt',
        storage_path: storagePath
      })

      if (result.error) throw new Error(result.error)

      toast.success("Knowledge Ingested", { id: toastId })
      setOpen(false)
      router.push("/knowledge")
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err)
      toast.error(err.message || "Failed to ingest file", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/inbox"))}>
              <Inbox className="mr-2 h-4 w-4" />
              <span>Inbox</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/agent-hub"))}>
              <Bot className="mr-2 h-4 w-4" />
              <span>Agent Hub</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/insights"))}>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Insights</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/knowledge"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Knowledge Bank</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/contacts"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Identity Vault</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/agent-hub"))}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Create New Agent</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings/whatsapp"))}>
              <Phone className="mr-2 h-4 w-4" />
              <span>Connect WhatsApp</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Workspace Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings/integrations"))}>
              <Zap className="mr-2 h-4 w-4" />
              <span>Integrations</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Drag and Drop Overlay */}
        {(isDragging || isUploading) && (
          <div className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[1.5rem] transition-all duration-300 backdrop-blur-md",
            isDragging ? "bg-[#c65f39]/20 border-2 border-dashed border-[#c65f39]" : "bg-white/80"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-[#c65f39] animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Ingesting Intelligence...</p>
              </>
            ) : (
              <>
                <FileUp className="h-10 w-10 text-[#c65f39] mb-4 animate-bounce" />
                <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Drop to Ingest Knowledge</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-widest">PDF, Text, or Markdown</p>
              </>
            )}
          </div>
        )}
      </div>
    </CommandDialog>
  )
}
