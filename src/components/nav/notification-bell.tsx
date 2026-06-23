"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Heart, Zap, Lightbulb, RefreshCw, Megaphone, CheckCheck, ExternalLink, X } from "lucide-react"
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
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
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
    modalClickSound()
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
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 top-0 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/5 z-[200] overflow-hidden"
          >
            {}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="h-4 px-1.5 rounded-full bg-[#c65f39]/10 text-[#c65f39] text-[8px] font-bold flex items-center">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {}
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-gray-900">All clear</p>
                <p className="text-[10px] text-gray-500 mt-0.5">No new notifications</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[360px]">
                <div className="py-1">
                  {notifications.map((n) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                          n.is_read ? "hover:bg-gray-50/50" : "bg-[#c65f39]/[0.02] hover:bg-[#c65f39]/[0.04]"
                        )}
                      >
                        {}
                        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>

                        {}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-xs leading-snug", n.is_read ? "text-gray-900" : "text-gray-900 font-semibold")}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#c65f39] shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400">{timeAgo(n.created_at)}</span>
                            {n.link && (
                              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#c65f39]">
                                <ExternalLink className="h-2.5 w-2.5" />
                                View
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function modalClickSound() {
  // noop
}
