"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Download, Users, Loader2, User, Phone, Mail } from "lucide-react"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/use-workspace"
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
import { createContact } from "@/app/actions/contacts"
import { toast } from "sonner"

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  last_active?: string
  appointments?: { count: number }[]
}

export default function ContactsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" })
  const supabase = createClient()

  const fetchContacts = useCallback(async () => {
    if (!workspaceId) return
    const { data } = await supabase
      .from("contacts")
      .select("*, appointments(count)")
      .eq("workspace_id", workspaceId as string)
      .order("last_active", { ascending: false })
    
    setContacts((data as unknown as Contact[]) || [])
    setIsLoading(false)
  }, [workspaceId, supabase])

  useEffect(() => {
    const init = async () => {
      await fetchContacts()
    }
    init()
  }, [fetchContacts])

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return
    
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
        fetchContacts()
    }
    setIsSubmitting(false)
  }

  if (wsLoading || isLoading) return (
    <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-600 font-medium">Loading contacts...</p>
    </div>
  )

  return (
    <div className="p-10 max-w-full font-sans pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm">
                <Users className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Identity Directory</h1>
                <p className="text-sm text-gray-600 mt-1 font-medium">Manage and monitor customer records across all channels.</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2.5 px-6 h-12 text-xs font-semibold border border-gray-100 bg-white rounded-xl text-gray-600 hover:text-black hover:border-gray-200 transition-all shadow-sm active:scale-95">
            <Download className="h-4 w-4" /> Export
          </button>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
                <button className="flex items-center gap-2.5 px-8 h-12 text-xs font-semibold bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                    <Plus className="h-4 w-4" /> Add Identity
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

      <ContactsTable initialContacts={contacts} workspaceId={workspaceId as string} />
    </div>
  )
}
