"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, RefreshCw, Zap, Megaphone, Lightbulb, BellRing, ExternalLink, CheckCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  title: string
  message: string
  type: "update" | "credit" | "announcement" | "tip" | "warning" | "booking" | "lead" | "escalation"
  link: string | null
  created_at: string
  is_read: boolean
}

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  update:       { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50/50" },
  credit:       { icon: Zap,       color: "text-amber-500", bg: "bg-amber-50/50" },
  announcement: { icon: Megaphone, color: "text-purple-500", bg: "bg-purple-50/50" },
  tip:          { icon: Lightbulb, color: "text-emerald-500", bg: "bg-emerald-50/50" },
  warning:      { icon: Zap,       color: "text-red-500",   bg: "bg-red-50/50" },
  booking:      { icon: BellRing,  color: "text-green-500", bg: "bg-green-50/50" },
  lead:         { icon: BellRing,  color: "text-blue-500",  bg: "bg-blue-50/50" },
  escalation:   { icon: BellRing,  color: "text-rose-500",  bg: "bg-rose-50/50" },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count ?? 0)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    }).catch(() => {})
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await Promise.all(
      unread.map((n) =>
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_id: n.id }),
        }).catch(() => {})
      )
    )
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id)
    if (n.link) {
      window.location.href = n.link
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
          open
            ? "bg-gray-900 text-white shadow-md"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ transformOrigin: "bottom left" }}
            className="fixed left-[72px] bottom-6 w-[380px] overflow-hidden rounded-[24px] bg-white border border-gray-200/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] z-[200]"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gray-50/50">
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-100 mb-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-[14px] font-medium text-gray-900">You're all caught up</p>
                <p className="text-[13px] text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                  There are no new notifications right now.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[440px]">
                <div className="p-2 space-y-1">
                  {notifications.map((n, idx) => {
                    const cfg = typeConfig[n.type]!
                    const Icon = cfg.icon
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "group relative flex items-start gap-4 rounded-2xl p-3 transition-colors cursor-pointer",
                          n.is_read
                            ? "hover:bg-gray-50"
                            : "bg-blue-50/30 hover:bg-blue-50/60"
                        )}
                      >
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100/50", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>

                        <div className="flex-1 space-y-1 pt-0.5 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-[14px] font-medium leading-snug truncate", n.is_read ? "text-gray-700" : "text-gray-900")}>
                              {n.title}
                            </p>
                            <span className="text-[11px] font-medium text-gray-400 shrink-0">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          
                          <p className={cn("text-[13px] leading-relaxed line-clamp-2", n.is_read ? "text-gray-500" : "text-gray-600")}>
                            {n.message}
                          </p>
                          
                          {n.link && (
                            <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[12px] font-medium text-blue-600">View details</span>
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                        </div>

                        {!n.is_read && (
                          <div className="absolute top-[18px] -left-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {notifications.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-3 flex justify-center">
                <a href="/settings/notifications" onClick={() => setOpen(false)} className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  View all notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
