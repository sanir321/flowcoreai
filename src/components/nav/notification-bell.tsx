"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, Zap, Lightbulb, RefreshCw, Megaphone, CheckCheck, ExternalLink, BellRing } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  title: string
  message: string
  type: "update" | "credit" | "announcement" | "tip"
  link: string | null
  created_at: string
  is_read: boolean
}

const typeConfig = {
  update:       { icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50" },
  credit:       { icon: Zap,       color: "text-amber-600", bg: "bg-amber-50" },
  announcement: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-50" },
  tip:          { icon: Lightbulb, color: "text-emerald-600", bg: "bg-emerald-50" },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
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
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-300",
          open
            ? "bg-[#c65f39]/10 text-[#c65f39]"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-transform duration-300 hover:scale-110",
            unreadCount > 0 && "fill-[#c65f39] text-[#c65f39]"
          )}
        />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black px-1 shadow-lg"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom left" }}
            className="fixed left-[66px] bottom-24 w-[400px] bg-white rounded-3xl border border-gray-100/80 shadow-2xl shadow-black/10 z-[200] overflow-hidden"
          >
            <div className="absolute -left-1.5 bottom-6 h-3 w-3 rotate-45 bg-white border-l border-b border-gray-100" />

            <div className="bg-gradient-to-r from-[#c65f39]/5 to-[#c65f39]/10 px-5 py-3.5 border-b border-[#c65f39]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-white/80 flex items-center justify-center shadow-sm shadow-[#c65f39]/5">
                    <BellRing className="h-3.5 w-3.5 text-[#c65f39]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 -mt-0.5">Notifications</h3>
                    <p className="text-[9px] text-gray-400 font-medium -mt-0.5">
                      {unreadCount > 0
                        ? `${unreadCount} unread · ${notifications.length} total`
                        : "You're all caught up"}
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark read
                  </button>
                )}
              </div>
            </div>

            {}
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-100/50 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-5 w-5 text-rose-400" />
                </div>
                <p className="text-sm font-bold text-gray-900">All clear</p>
                <p className="text-xs text-gray-400 mt-1 max-w-40 mx-auto leading-relaxed">
                  No new notifications. We'll let you know when something needs your attention.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="py-1.5">
                  {notifications.map((n, idx) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "flex items-start gap-3.5 mx-2 px-3.5 py-3 rounded-xl cursor-pointer transition-all",
                          n.is_read
                            ? "hover:bg-gray-50"
                            : "bg-gradient-to-r from-[#c65f39]/[0.03] to-transparent hover:from-[#c65f39]/[0.06]"
                        )}
                      >
                        {}
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-1 ring-black/[0.02]", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>

                        {}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-xs leading-snug", n.is_read ? "text-gray-800" : "text-gray-900 font-semibold")}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-[#c65f39] shrink-0 mt-1.5 shadow-sm shadow-[#c65f39]/30" />
                            )}
                          </div>
                          <p className={cn(
                            "text-[11px] mt-0.5 line-clamp-2 leading-relaxed",
                            n.is_read ? "text-gray-400" : "text-gray-500"
                          )}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] text-gray-400 font-medium">{timeAgo(n.created_at)}</span>
                            {n.link && (
                              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#c65f39] hover:text-[#a84d2e] transition-colors">
                                <ExternalLink className="h-2.5 w-2.5" />
                                View details
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {}
            {notifications.length > 5 && (
              <div className="px-5 py-2.5 border-t border-gray-50 bg-gradient-to-t from-white to-transparent">
                <p className="text-[9px] text-gray-400 text-center font-medium">
                  Showing {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
