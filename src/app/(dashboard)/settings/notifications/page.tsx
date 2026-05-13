"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Shield, Mail, Phone, MessageSquare, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateNotifications } from "@/app/actions/settings"
import { useWorkspace } from "@/hooks/use-workspace"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!workspaceId) return
    
    async function fetchConfig() {
      const { data } = await (supabase
        .from("workspace_notifications") as any)
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      
      if (!data) {
        // Create default record
        const { data: newData } = await (supabase
          .from("workspace_notifications") as any)
          .upsert({ workspace_id: workspaceId }, { onConflict: "workspace_id" })
          .select()
          .single()
        setConfig(newData)
      } else {
        setConfig(data)
      }
      setIsLoading(false)
    }
    
    fetchConfig()
  }, [workspaceId])

  const handleToggle = async (key: string, value: string | boolean) => {
    if (!workspaceId) return
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    
    const result = await updateNotifications({
      workspace_id: workspaceId,
      [key]: value
    })

    if (result.error) {
      toast.error(result.error)
      // Revert on error
      setConfig(config)
    } else {
      toast.success("Notification updated")
    }
  }

  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }
  }

  if (wsLoading || isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>

  return (
    <div className="max-w-4xl space-y-10 font-sans pb-32">
      <motion.div {...fadeUp} className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Notifications</h1>
        <p className="text-sm font-medium text-gray-500">Configure how and when you want to be notified of Assistant activity.</p>
      </motion.div>

      {/* Master Toggle */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="p-8 bg-white border-gray-100 flex justify-between items-center group hover:border-[#D95E46]/30 transition-all duration-500 shadow-sm">
           <div className="flex items-center gap-4 text-gray-900">
              <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#D95E46]">
                 <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                 <p className="text-sm font-semibold">Real-time Push Notifications</p>
                 <p className="text-[11px] text-gray-500">Activate global browser notifications for all agent events.</p>
              </div>
           </div>
           <Switch 
            checked={config?.notification_mode === 'instant'} 
            onCheckedChange={(val) => handleToggle('notification_mode', val ? 'instant' : 'daily_summary')}
            className="data-[state=checked]:bg-[#10B981]" 
           />
        </Card>
      </motion.div>

      {/* Grouped Notifications */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-4">
         <h3 className="text-[10px] font-bold text-gray-400 ml-1">Assistant Events</h3>
         <Card className="bg-white border-gray-100 overflow-hidden divide-y divide-gray-50 shadow-sm text-gray-900">
            {[
              { id: 'email_on_escalation', label: "Escalations", desc: "When an AI teammate needs manual intervention.", icon: Shield },
              { id: 'email_on_booking', label: "New Appointments", desc: "Alerts for confirmed calendar bookings.", icon: MessageSquare },
              { id: 'email_on_lead', label: "Lead Captures", desc: "Notification when new customers are saved to Sheets.", icon: Zap }
            ].map((item, i) => (
              <div key={i} className="p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors group">
                 <div className="flex items-center gap-4">
                    <item.icon className="h-4 w-4 text-gray-300 group-hover:text-[#D95E46] transition-colors" />
                    <div className="space-y-0.5">
                       <p className="text-sm font-medium">{item.label}</p>
                       <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                 </div>
                 <Checkbox 
                    checked={config?.[item.id]} 
                    onCheckedChange={(val) => handleToggle(item.id, !!val)}
                    className="border-gray-200 data-[state=checked]:bg-[#D95E46] data-[state=checked]:border-[#D95E46]" 
                 />
              </div>
            ))}
         </Card>
      </motion.div>

      {/* Channel specific */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="space-y-4">
         <h3 className="text-[10px] font-bold text-gray-400 ml-1">Communication Channels</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Email Notifications", icon: Mail, active: true },
              { label: "SMS Alerts (Coming Soon)", icon: Phone, active: false }
            ].map((item, i) => (
              <Card key={i} className={cn(
                "p-6 bg-white border-gray-100 flex justify-between items-center transition-all duration-500 shadow-sm",
                !item.active && "opacity-50 grayscale pointer-events-none"
              )}>
                 <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-[#D95E46]" />
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                 </div>
                 <Switch checked={item.active} className="data-[state=checked]:bg-[#D95E46]" />
              </Card>
            ))}
         </div>
      </motion.div>
    </div>
  )
}
