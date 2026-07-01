"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Volume2, AlertTriangle, Inbox, MessageSquare, Save, Bell, Zap, ExternalLink, CheckCheck } from "lucide-react"
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
  { id: 'email_on_escalation', label: "Escalations", desc: "When an AI teammate needs manual intervention.", icon: AlertTriangle },
  { id: 'email_on_booking', label: "New Appointments", desc: "Alerts for confirmed calendar bookings.", icon: Inbox },
  { id: 'email_on_lead', label: "Lead Captures", desc: "Notification when new customers are saved to Sheets.", icon: Volume2 }
]

const MODES = [
  { value: 'instant' as const, label: "Instant", desc: "Real-time push for all events" },
  { value: 'digest' as const, label: "Daily Digest", desc: "Single daily summary" },
  { value: 'off' as const, label: "Off", desc: "Suppress all notifications" }
]

interface HistoryNotification {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  created_at: string
  is_read: boolean
}

export default function NotificationsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [isLoading, setIsLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [notifications, setNotifications] = useState<HistoryNotification[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!workspaceId) return
    
    async function fetchConfig() {
      const { data } = await (supabase
        .from("workspace_notifications") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      
      if (!data) {
        const { data: newData } = await (supabase
          .from("workspace_notifications") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .upsert({ workspace_id: workspaceId }, { onConflict: "workspace_id" })
          .select()
          .single()
        setConfig(newData)
        setWhatsappNumber("")
      } else {
        setConfig(data)
        setWhatsappNumber(data.whatsapp_alert_number || "")
      }
      setIsLoading(false)
    }
    
    fetchConfig()
    fetchNotifications()
  }, [workspaceId, supabase])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch {}
  }, [])

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
      toast.success("Updated")
    }
  }

  const saveWhatsAppNumber = async () => {
    if (!workspaceId) return
    setSavingWhatsapp(true)
    const result = await updateNotifications({
      workspace_id: workspaceId,
      whatsapp_alert_number: whatsappNumber || null,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      setConfig({ ...config, whatsapp_alert_number: whatsappNumber })
      toast.success("WhatsApp alert number saved")
    }
    setSavingWhatsapp(false)
  }

  if (wsLoading || isLoading) return (
    <div className="max-w-4xl mx-auto space-y-10 font-sans pb-32 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="h-8 w-36 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>

      <hr className="border-gray-100 my-10" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
        <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
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
          {MODES.map((mode) => {
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

      {/* WhatsApp Alert Number */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="space-y-5">
        <h4 className="text-[10px] font-bold text-[#c65f39]">WhatsApp Alert Number</h4>
        <div className="px-6 py-5 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center gap-4 mb-4">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Forward Escalations to WhatsApp</p>
              <p className="text-xs text-gray-500 font-medium">Receive urgent alerts on this number</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+919XXXXXXXXX"
              className="h-11 bg-white border-gray-200 rounded-xl text-sm flex-1 font-medium text-gray-900"
            />
            <Button
              onClick={saveWhatsAppNumber}
              disabled={savingWhatsapp}
              className="h-11 px-6 rounded-xl bg-black text-white hover:bg-gray-800 flex items-center gap-2 text-[11px] font-bold transition-all active:scale-95"
            >
              {savingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notification History */}
      {notifications.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="space-y-5">
          <h4 className="text-[10px] font-bold text-[#c65f39]">History</h4>
          <div className="space-y-1 border border-gray-100 rounded-xl bg-white divide-y divide-gray-50">
            {notifications.slice(0, 20).map((n) => (
              <a
                key={n.id}
                href={n.link || "#"}
                className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  n.type === "warning" ? "bg-red-50" :
                  n.type === "escalation" ? "bg-orange-50" :
                  n.type === "booking" ? "bg-green-50" :
                  n.type === "lead" ? "bg-blue-50" :
                  "bg-gray-50"
                )}>
                  <Bell className={cn(
                    "h-3.5 w-3.5",
                    n.type === "warning" ? "text-red-500" :
                    n.type === "escalation" ? "text-orange-500" :
                    n.type === "booking" ? "text-green-500" :
                    n.type === "lead" ? "text-blue-500" :
                    "text-gray-400"
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-xs", n.is_read ? "text-gray-600" : "text-gray-900 font-semibold")}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#c65f39] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-gray-400">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                {n.link && <ExternalLink className="h-3 w-3 text-gray-300 mt-1.5 shrink-0" />}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
        <hr className="border-gray-100 mb-6" />
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          Escalation alerts are sent immediately regardless of delivery mode. Digest mode compiles non-urgent events into a single daily summary.
        </p>
      </motion.div>
    </div>
  )
}
