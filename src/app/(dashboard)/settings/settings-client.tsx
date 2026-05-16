"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Trash2, 
  Loader2,
  Building2,
  MapPin,
  AlertTriangle
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { updateWorkspace, deleteWorkspace } from "@/app/actions/workspace"
import { useRouter } from "next/navigation"

interface Workspace {
  id: string
  name: string
  business_type: string | null
  timezone: string
  owner_personal_phone: string | null
}

interface SettingsClientProps {
  initialWorkspace: Workspace
}

export function SettingsClient({ initialWorkspace }: SettingsClientProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteWorkspace()
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      router.push("/onboarding")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateWorkspace({
        id: workspace.id,
        name: workspace.name,
        business_type: workspace.business_type ?? undefined,
        timezone: workspace.timezone,
        owner_personal_phone: workspace.owner_personal_phone ?? undefined
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Workspace updated successfully")
      router.refresh()
    }
    setIsSaving(false)
  }

  return (
    <div className="max-w-3xl space-y-8 font-sans pb-32">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Workspace</h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">Manage your workspace identity and global service configuration.</p>
      </div>
      
      <hr className="border-gray-100" />

      {/* Profile Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <h3 className="text-[10px] font-bold text-gray-400">Business Details</h3>
        </div>
        
        <Card className="p-8 bg-white border-gray-100 shadow-sm space-y-8">
           <div className="space-y-6">
              <div className="space-y-2.5">
                 <Label className="text-xs font-bold text-gray-700 ml-1">Legal Entity Name</Label>
                 <Input 
                   value={workspace.name}
                   onChange={(e) => setWorkspace(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="e.g. FlowCore Systems" 
                   className="h-12 border-gray-200 focus:border-black transition-all text-gray-900 bg-gray-50/30"
                 />
                 <p className="text-[10px] text-gray-500 ml-1 font-medium">This name will be used by your automated agents during conversation.</p>
              </div>

              <div className="space-y-2.5">
                 <Label className="text-xs font-bold text-gray-700 ml-1">Industry Sector</Label>
                 <Select 
                    value={workspace.business_type || "tech"}
                    onValueChange={(val) => setWorkspace(prev => ({ ...prev, business_type: val }))}
                 >
                   <SelectTrigger className="h-12 border-gray-200 focus:ring-0 bg-gray-50/30 text-gray-900">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-white border-gray-100 text-gray-900">
                     <SelectItem value="tech">Technology & Software</SelectItem>
                     <SelectItem value="finance">Banking & Finance</SelectItem>
                     <SelectItem value="retail">E-commerce & Retail</SelectItem>
                     <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                   </SelectContent>
                 </Select>
              </div>

              <div className="space-y-2.5">
                 <Label className="text-xs font-bold text-gray-700 ml-1">Personal WhatsApp Number (for Alerts)</Label>
                 <Input 
                   value={workspace.owner_personal_phone || ""}
                   onChange={(e) => setWorkspace(prev => ({ ...prev, owner_personal_phone: e.target.value }))}
                   placeholder="e.g. +91 9876543210" 
                   className="h-12 border-gray-200 focus:border-black transition-all text-gray-900 bg-gray-50/30"
                 />
                 <p className="text-[10px] text-gray-500 ml-1 font-medium">Critical system alerts and notifications will be sent here.</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <Label className="text-xs font-bold text-gray-700">Timezone Settings</Label>
                 </div>
                 <Select 
                    value={workspace.timezone || "utc"}
                    onValueChange={(val) => setWorkspace(prev => ({ ...prev, timezone: val }))}
                 >
                    <SelectTrigger className="h-12 border-gray-200 focus:ring-0 bg-gray-50/30 text-gray-900">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 text-gray-900">
                        <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                        <SelectItem value="Asia/Kolkata">IST (India Standard Time)</SelectItem>
                    </SelectContent>
                 </Select>
                 <p className="text-[10px] text-gray-500 ml-1 font-medium">Determines the &quot;current time&quot; for scheduling calculations.</p>
              </div>
           </div>
        </Card>
      </section>

      <div className="flex justify-end pt-4">
         <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 text-xs font-bold transition-all shadow-lg active:scale-95"
         >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
         </Button>
      </div>

      {/* Danger Zone */}
      <hr className="border-gray-200 mt-16" />
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Danger Zone</h3>
        </div>

        <Card className="p-8 bg-white border-red-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-900">Delete this workspace</h4>
              <p className="text-xs text-gray-500">Permanently delete your workspace, all agents, conversations, contacts, and settings. This action cannot be undone.</p>
            </div>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl px-6 h-10 text-xs font-bold shrink-0 transition-all border border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete Workspace
            </Button>
          </div>
        </Card>
      </section>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Workspace?</h3>
                  <p className="text-sm text-gray-500">This action is permanent and irreversible.</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-red-800">This will permanently delete:</p>
                <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                  <li>All agents and their configurations</li>
                  <li>All conversations and message history</li>
                  <li>All contacts and imported data</li>
                  <li>WhatsApp device connection</li>
                  <li>Web widget settings</li>
                  <li>Billing & credit balance</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl h-11 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl h-11 text-xs font-bold transition-all"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
