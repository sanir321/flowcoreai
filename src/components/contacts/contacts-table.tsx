"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Search, 
  Phone, 
  Globe, 
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronRight,
  User,
  Clock,
  Calendar,
  MessageCircle,
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { 
  Sheet, 
  SheetContent, 
  SheetTitle, 
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateContact, sendManualMessage, getContactsPaginated } from "@/app/actions/contacts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"


interface ContactsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialContacts: any[]
  workspaceId: string
}

export function ContactsTable({ initialContacts = [], workspaceId }: ContactsTableProps) {
  const [contacts, setContacts] = useState(initialContacts || [])
  const [search, setSearch] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [manualMessage, setManualMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const result = await getContactsPaginated(workspaceId, contacts.length, 10)
    if (result.data?.contacts) {
      const newContacts = result.data.contacts
      if (newContacts.length < 10) setHasMore(false)
      setContacts(prev => [...prev, ...newContacts])
    }
    setLoadingMore(false)
  }, [workspaceId, contacts.length, loadingMore, hasMore])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  const filteredContacts = (contacts || []).filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
                         (c.phone || '').includes(search) || 
                         (c.email || '').toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const handleSendMessage = async () => {
    if (!manualMessage.trim() || !selectedContact) return
    setIsSending(true)
    const result = await sendManualMessage({
      workspace_id: workspaceId,
      contact_id: selectedContact.id,
      phone: selectedContact.phone,
      message: manualMessage
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Message sent successfully")
      setManualMessage("")
    }
    setIsSending(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedContact) return
    setIsSaving(true)
    const result = await updateContact({
      contact_id: selectedContact.id,
      name: selectedContact.name,
      email: selectedContact.email,
      notes: selectedContact.notes,
      tags: selectedContact.tags
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Contact updated successfully")
      setContacts(contacts.map(c => c.id === selectedContact.id ? selectedContact : c))
      setSelectedContact(null)
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Search Bar */}
      <div className="flex justify-end pb-4">
        <div className="w-full max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Search contacts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 pl-12 pr-6 rounded-2xl bg-white border-gray-100 focus:border-black/10 focus:shadow-xl transition-all text-sm font-medium placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Main Table - FlowCore Minimalist */}
      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-white border-b border-gray-100">
            <TableRow className="hover:bg-transparent border-gray-100 h-16">
              <TableHead className="text-gray-400 font-bold text-[10px] pl-10">Name</TableHead>
              <TableHead className="text-gray-400 font-bold text-[10px]">Channel</TableHead>
              <TableHead className="text-gray-400 font-bold text-[10px]">Last Active</TableHead>
              <TableHead className="text-gray-400 font-bold text-[10px]">Sessions</TableHead>
              <TableHead className="text-gray-400 font-bold text-[10px]">Tags</TableHead>
              <TableHead className="text-right pr-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-80 text-center">
                   <div className="space-y-6">
                      <div className="h-20 w-20 rounded-[2.5rem] bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
                         <User className="h-8 w-8 text-gray-200" />
                      </div>
                      <p className="text-[11px] font-bold text-gray-300">No contacts found</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  className="border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-all duration-300 group h-24 text-gray-900"
                  onClick={() => setSelectedContact(contact)}
                >
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm group-hover:border-black/10 transition-all">
                        <span className="font-bold text-xs">
                          {(contact.name || 'U').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-semibold tracking-tight group-hover:text-black transition-colors">{contact.name || 'Anonymous User'}</span>
                        <span className="text-[11px] font-medium text-gray-400 mt-1">{contact.phone || contact.email || 'No record'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                          {contact.channel === 'whatsapp' ? <Phone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                       </div>
                       <span className="text-xs font-bold text-gray-600 capitalize tracking-tight">{contact.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2.5">
                        <Clock className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-xs font-medium text-gray-500">
                           {contact.last_active ? new Date(contact.last_active).toLocaleDateString() : 'Never'}
                        </span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-sm font-bold">{contact.conversation_count}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[9px] font-bold bg-gray-100 text-gray-500 border-none px-2.5 py-1">
                          {tag}
                        </Badge>
                      ))}
                      {(contact.tags?.length || 0) > 2 && (
                        <span className="text-[10px] font-bold text-gray-400">+{contact.tags.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-black group-hover:border-black/10 group-hover:shadow-md transition-all ml-auto">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
        <div ref={sentinelRef} className="h-4" />
      </div>

      {/* Edit Contact Sheet - Minimalist Profile */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <SheetContent className="bg-white border-l border-gray-100 sm:max-w-md p-0 overflow-hidden font-sans">
          <div className="h-full flex flex-col">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-5">
                 <div className="h-14 w-14 rounded-[1.25rem] bg-black flex items-center justify-center text-white font-bold text-sm shadow-xl text-gray-900">
                    {(selectedContact?.name || 'U').substring(0, 2)}
                 </div>
                 <div className="space-y-1">
                    <SheetTitle className="text-xl font-bold text-gray-900 tracking-tight leading-none">{selectedContact?.name || 'Contact Profile'}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                       <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                       <span className="text-[10px] font-bold text-gray-400">Verified Identity</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setSelectedContact(null)} className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all group active:scale-90"><X className="h-5 w-5 text-gray-300 group-hover:text-black" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 text-gray-900">
              {selectedContact && (
                <form id="contact-form" onSubmit={handleUpdate} className="space-y-10">
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-gray-900 ml-1">Full Name</Label>
                        <Input 
                          value={selectedContact.name || ''} 
                          onChange={(e) => setSelectedContact({...selectedContact, name: e.target.value})}
                          className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-black/20 transition-all text-sm font-medium"
                        />
                     </div>
                     
                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-gray-900 ml-1">Communication Channel</Label>
                        <Input 
                          value={selectedContact.email || selectedContact.phone || ''} 
                          onChange={(e) => setSelectedContact({...selectedContact, email: e.target.value})}
                          className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-black/20 transition-all text-sm font-medium"
                        />
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-gray-900 ml-1">Activity Overview</Label>
                        <Textarea 
                          value={selectedContact.notes || ''} 
                          onChange={(e) => setSelectedContact({...selectedContact, notes: e.target.value})}
                          className="bg-gray-50/50 border-gray-100 rounded-2xl min-h-[140px] focus:bg-white focus:border-black/20 transition-all p-5 text-sm font-medium leading-relaxed resize-none"
                          placeholder="Add specific notes or customer context..."
                        />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 pt-2">
                        {[
                          { label: "Created", val: new Date(selectedContact.created_at).toLocaleDateString(), icon: Calendar },
                          { label: "Channel", val: selectedContact.channel, icon: Globe, capitalize: true },
                          { label: "Interactions", val: selectedContact.conversation_count, icon: MessageCircle },
                          { label: "Status", val: "Active", icon: ShieldCheck },
                        ].map((m, i) => (
                          <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4 shadow-sm hover:border-black/10 transition-all group">
                             <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all">
                                <m.icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
                             </div>
                             <div className="space-y-1 min-w-0">
                               <p className="text-[9px] font-bold text-gray-400 truncate">{m.label}</p>
                               <p className={cn("text-xs font-bold text-gray-900 truncate", m.capitalize && "capitalize")}>{m.val}</p>
                             </div>
                          </div>
                        ))}
                     </div>

                     {/* Manual Outbound Message Area */}
                     <div className="pt-6 border-t border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="h-6 w-6 rounded-lg bg-[#c65f39]/10 flex items-center justify-center">
                              <Zap className="h-3 w-3 text-[#c65f39]" />
                           </div>
                           <span className="text-[10px] font-bold text-gray-900">Quick WhatsApp Message</span>
                        </div>
                        <div className="relative group">
                           <Textarea 
                              value={manualMessage}
                              onChange={(e) => setManualMessage(e.target.value)}
                              placeholder="Type a manual message to send now..."
                              className="min-h-[100px] bg-white border-gray-100 rounded-2xl focus:border-[#c65f39] transition-all p-4 text-sm font-medium resize-none shadow-sm"
                           />
                           <Button 
                              onClick={handleSendMessage}
                              disabled={isSending || !manualMessage.trim()}
                              className="absolute bottom-3 right-3 h-10 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                           >
                              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                           </Button>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium italic ml-1">Manual messages will appear in the history.</p>
                     </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-white">
               <Button variant="outline" onClick={() => setSelectedContact(null)} className="flex-1 h-12 rounded-xl font-semibold text-xs border-gray-200 hover:bg-gray-50">Cancel</Button>
               <Button 
                 form="contact-form"
                 type="submit" 
                 className="flex-1 h-12 rounded-xl bg-black text-white font-semibold text-xs hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                 disabled={isSaving}
               >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
               </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
