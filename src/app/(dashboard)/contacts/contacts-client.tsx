"use client"

import { useState } from "react"
import { Plus, Download, Users, Loader2, User, Phone, Mail } from "lucide-react"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createContact, exportContacts } from "@/app/actions/contacts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  last_active?: string
  appointments?: { count: number }[]
}

interface ContactsClientProps {
  initialContacts: Contact[]
  workspaceId: string
}

export function ContactsClient({ initialContacts, workspaceId }: ContactsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" })
  const router = useRouter()

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await createContact({
        workspace_id: workspaceId,
        ...formData
    })

    if (result.error) {
        toast.error(result.error)
    } else {
        toast.success("Contact added successfully")
        setIsAddOpen(false)
        setFormData({ name: "", phone: "", email: "" })
        router.refresh()
    }
    setIsSubmitting(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportContacts(workspaceId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data?.csv) {
        const blob = new Blob([result.data.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('hidden', '')
        a.setAttribute('href', url)
        a.setAttribute('download', `contacts-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success("Export successful")
      }
    } catch {
      toast.error("Failed to export contacts")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-full font-sans pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm">
                <Users className="h-4 w-4" />
            </div>
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Identity Directory</h1>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">Manage and monitor customer records across all channels.</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 h-9 text-[10px] font-semibold border border-gray-100 bg-white rounded-lg text-gray-600 hover:text-black hover:border-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Export
          </button>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
                <button className="flex items-center gap-2 px-4 h-9 text-[10px] font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow active:scale-95">
                    <Plus className="h-3 w-3" /> Add
                </button>
            } />
            <DialogContent className="bg-white rounded-3xl sm:max-w-md p-6 border-gray-100 shadow-2xl overflow-hidden font-sans text-gray-900">
                <DialogHeader className="space-y-2 pb-6 border-b border-gray-50">
                    <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight text-left">New Identity</DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 font-medium text-left">Manually create a new customer record.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddContact} className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-900 ml-1">Full Name</Label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-black transition-colors" />
                                <Input 
                                    required
                                    placeholder="Customer name" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="h-12 pl-10 bg-gray-50/50 border-gray-100 rounded-xl text-xs font-medium focus:bg-white focus:border-black/10 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-900 ml-1">WhatsApp JID</Label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-black transition-colors" />
                                <Input 
                                    required
                                    placeholder="917904..." 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="h-12 pl-10 bg-gray-50/50 border-gray-100 rounded-xl text-xs font-medium focus:bg-white focus:border-black/10 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-900 ml-1">Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-black transition-colors" />
                                <Input 
                                    type="email"
                                    placeholder="customer@email.com" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="h-12 pl-10 bg-gray-50/50 border-gray-100 rounded-xl text-xs font-medium focus:bg-white focus:border-black/10 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all gap-2"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Identity"}
                    </Button>
                </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ContactsTable initialContacts={initialContacts} workspaceId={workspaceId} />
    </div>
  )
}
