"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Bell, Shield, Mail, MessageSquare, Zap, Loader2, Volume2, AlertTriangle, Inbox } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateNotifications } from "@/app/actions/settings"
import { useWorkspace } from "@/hooks/use-workspace"
import { cn } from "@/lib/utils"

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
}

const NOTIFICATION_EVENTS = [
  { 
    id: 'email_on_escalation', 
    label: "Escalations", 
    desc: "When an AI teammate needs manual intervention.",
    icon: AlertTriangle
  },
  { 
    id: 'email_on_booking', 
    label: "New Appointments", 
    desc: "Alerts for confirmed calendar bookings.",
    icon: Inbox
  },
  { 
    id: 'email_on_lead', 
    label: "Lead Captures", 
    desc: "Notification when new customers are saved to Sheets.",
    icon: Volume2
  }
]

export default function NotificationsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [isLoading, setIsLoading] = useState(true)
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
    const prev = config
    setConfig({ ...config, [key]: value })
    
    const result = await updateNotifications({
      workspace_id: workspaceId,
      [key]: value
    })

    if (result.error) {
      toast.error(result.error)
      setConfig(prev)
    } else {
      toast.success("Notification updated")
    }
  }

  if (wsLoading || isLoading) return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      <p className="text-sm text-gray-500 font-medium">Loading notification settings...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-10 font-sans pb-32">
      <motion.div {...fadeUp}>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Notifications</h1>
        <p className="text-sm font-medium text-gray-500 mt-2 leading-relaxed">
          Configure how and when you want to be notified of Assistant activity.
        </p>
      </motion.div>

      <hr className="border-gray-100 my-10" />

      {/* Delivery Mode */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-5">
        <h4 className="text-[10px] font-bold text-[#c65f39]">Delivery Mode</h4>
        <div className="space-y-3">
          {[
            { value: 'instant', label: "Instant", desc: "Real-time push for all events" },
            { value: 'digest', label: "Daily Digest", desc: "Single daily summary" },
            { value: 'off', label: "Off", desc: "Suppress all notifications" }
          ].map((mode) => {
            const isActive = config?.notification_mode === mode.value
            return (
              <div
                key={mode.value}
                onClick={() => handleToggle('notification_mode', mode.value)}
                className={cn(
                  "flex items-center justify-between px-6 py-5 rounded-xl border transition-all duration-300 cursor-pointer",
                  isActive
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-gray-100 hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    isActive ? "bg-[#10B981]" : "bg-gray-200"
                  )} />
                  <div>
                    <p className={cn(
                      "text-sm font-semibold",
                      isActive ? "text-gray-900" : "text-gray-600"
                    )}>
                      {mode.label}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{mode.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleToggle('notification_mode', mode.value)}
                  className="data-[state=checked]:bg-[#10B981]"
                />
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Event Notifications */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-5">
        <h4 className="text-[10px] font-bold text-[#c65f39]">Events</h4>
        <div className="space-y-2">
          {NOTIFICATION_EVENTS.map((item) => {
            const isChecked = config?.[item.id] ?? true
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors",
                    isChecked ? "text-gray-700" : "text-gray-300"
                  )} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={isChecked}
                  onCheckedChange={(val) => handleToggle(item.id, val)}
                  className="data-[state=checked]:bg-[#10B981]"
                />
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Channels */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="space-y-5">
        <h4 className="text-[10px] font-bold text-[#c65f39]">Channels</h4>
        <div className="space-y-3">
          {[
            { label: "Email Notifications", icon: Mail, desc: "Receive alerts via email", active: true },
            { label: "WhatsApp Alerts", icon: MessageSquare, desc: "Forward notifications to your WhatsApp", active: false },
            { label: "SMS Alerts", icon: Bell, desc: "Get SMS for critical escalations", active: false }
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-6 py-5 rounded-xl border bg-white transition-all duration-300",
                item.active ? "border-gray-100" : "border-gray-50 opacity-50"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={item.active}
                className="data-[state=checked]:bg-[#10B981] pointer-events-none"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
        <hr className="border-gray-100 mb-6" />
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          Escalation alerts are sent immediately regardless of mode. WhatsApp alerts require a configured alert number in workspace settings.
        </p>
      </motion.div>
    </div>
  )
}
