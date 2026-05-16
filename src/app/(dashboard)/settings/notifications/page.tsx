"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell, Shield, Mail, MessageSquare, Zap, Loader2, Settings2, ExternalLink, Volume2, AlertTriangle, Inbox } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateNotifications } from "@/app/actions/settings"
import { useWorkspace } from "@/hooks/use-workspace"
import { cn } from "@/lib/utils"

const ANIMATION = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: ANIMATION
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

const NOTIFICATION_MODES = [
  { 
    value: 'instant', 
    label: "Instant", 
    desc: "Real-time push for all events",
    icon: Zap
  },
  { 
    value: 'digest', 
    label: "Daily Digest", 
    desc: "Single daily summary",
    icon: MessageSquare,
    comingSoon: true
  },
  { 
    value: 'off', 
    label: "Quiet Hours", 
    desc: "Suppress all notifications",
    icon: Bell,
    comingSoon: true
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
      <motion.div {...fadeUp} transition={{ ...ANIMATION, delay: 0.1 }} className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-[#c65f39]">Delivery Mode</h4>
          <p className="text-lg font-semibold text-gray-900 tracking-tight">How alerts reach you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NOTIFICATION_MODES.map((mode) => {
            const isActive = config?.notification_mode === mode.value
            const isDisabled = mode.comingSoon && !isActive
            return (
              <Card
                key={mode.value}
                onClick={() => !mode.comingSoon && handleToggle('notification_mode', mode.value)}
                className={cn(
                  "relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer",
                  isActive
                    ? "bg-black text-white border-black shadow-xl"
                    : "bg-white border-gray-100 hover:border-black/10 shadow-sm",
                  isDisabled && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                {mode.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-gray-100 text-[9px] font-bold rounded-full uppercase tracking-widest text-gray-400">
                      Soon
                    </span>
                  </div>
                )}
                <div className="space-y-6">
                  <div className={cn(
                    "h-12 w-12 rounded-[1.25rem] border flex items-center justify-center transition-all duration-500",
                    isActive
                      ? "bg-white/10 border-white/20"
                      : "bg-gray-50 border-gray-100"
                  )}>
                    <mode.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-gray-400"
                    )} />
                  </div>
                  <div className="space-y-1">
                    <p className={cn(
                      "text-base font-semibold tracking-tight",
                      isActive ? "text-white" : "text-gray-900"
                    )}>
                      {mode.label}
                    </p>
                    <p className={cn(
                      "text-sm font-medium leading-snug",
                      isActive ? "text-gray-300" : "text-gray-500"
                    )}>
                      {mode.desc}
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => !mode.comingSoon && handleToggle('notification_mode', mode.value)}
                    className={cn(
                      "data-[state=checked]:bg-[#10B981]",
                      isActive && "data-[state=checked]:bg-white/30"
                    )}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* Event Notifications */}
      <motion.div {...fadeUp} transition={{ ...ANIMATION, delay: 0.2 }} className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-[#c65f39]">Events</h4>
          <p className="text-lg font-semibold text-gray-900 tracking-tight">Assistant Events</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {NOTIFICATION_EVENTS.map((item) => {
            const isChecked = config?.[item.id] ?? true
            return (
              <Card
                key={item.id}
                className={cn(
                  "p-8 rounded-[2.5rem] bg-white border-gray-100 shadow-sm hover:border-black/5 hover:shadow-md transition-all duration-500",
                  isChecked && "border-emerald-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-12 w-12 rounded-[1.25rem] border flex items-center justify-center transition-all duration-500",
                      isChecked
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-gray-50 border-gray-100"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        isChecked ? "text-emerald-600" : "text-gray-400"
                      )} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm font-medium text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(val) => handleToggle(item.id, val)}
                    className="data-[state=checked]:bg-[#10B981]"
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* Channels */}
      <motion.div {...fadeUp} transition={{ ...ANIMATION, delay: 0.3 }} className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-[#c65f39]">Channels</h4>
          <p className="text-lg font-semibold text-gray-900 tracking-tight">Communication Channels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { 
              label: "Email Notifications", 
              icon: Mail, 
              desc: "Receive alerts via email",
              active: true 
            },
            { 
              label: "WhatsApp Alerts", 
              icon: ExternalLink, 
              desc: "Forward notifications to your WhatsApp number",
              active: false,
              note: config?.whatsapp_alert_number || "Not configured"
            },
            { 
              label: "SMS Alerts", 
              icon: Bell, 
              desc: "Get SMS for critical escalations",
              active: false 
            }
          ].map((item, i) => (
            <Card key={i} className={cn(
              "p-8 rounded-[2.5rem] bg-white border-gray-100 shadow-sm transition-all duration-500 relative overflow-hidden",
              !item.active && "opacity-60 grayscale pointer-events-none"
            )}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <item.icon className="h-20 w-20 text-black" />
              </div>
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Switch
                    checked={item.active}
                    className="data-[state=checked]:bg-[#10B981]"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Info footer */}
      <motion.div {...fadeUp} transition={{ ...ANIMATION, delay: 0.4 }}>
        <Card className="p-8 bg-gray-50/50 border-gray-100 rounded-[2.5rem] shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#c65f39]/10 border border-[#c65f39]/20 flex items-center justify-center shrink-0">
              <Settings2 className="h-5 w-5 text-[#c65f39]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">About Notification Delivery</p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                Escalation alerts are sent immediately regardless of mode. 
                Digest mode compiles non-urgent events into a single daily summary. 
                WhatsApp alerts require a configured alert number in workspace settings.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
