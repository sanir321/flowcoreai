"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, RefreshCw, Zap, Megaphone, Lightbulb, BellRing, ExternalLink, Bot, Check, AlertCircle, Info, CalendarCheck, UserPlus, ShieldAlert } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: "update" | "credit" | "announcement" | "tip" | "warning" | "booking" | "lead" | "escalation"
  link: string | null
  created_at: string
  is_read: boolean
}

// Map old types to the new card styling. "ai" types vs "system" types.
const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  update:       { icon: Info, color: "text-[#00B4D8]", bg: "bg-[#00B4D8]/10" },
  credit:       { icon: Zap, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  announcement: { icon: Megaphone, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
  tip:          { icon: Lightbulb, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
  warning:      { icon: AlertCircle, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
  booking:      { icon: CalendarCheck, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
  lead:         { icon: UserPlus, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
  escalation:   { icon: ShieldAlert, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const fetchNotifications = useCallback(async () => {
    setIsRefreshing(true)
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
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
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
            className="fixed left-[72px] bottom-6 w-[400px] overflow-hidden rounded-[24px] bg-white border border-gray-200 shadow-2xl z-[200] flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={fetchNotifications} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Body */}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 mb-3">
                  <Bell className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-[15px] font-medium text-gray-900">You're all caught up</p>
                <p className="text-[13px] text-gray-500 mt-1 max-w-[220px] mx-auto">When your AI captures leads, books appointments, or escalates chats, they will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[440px] bg-gray-50/30">
                <div className="p-3 space-y-2">
                  {notifications.map((n, idx) => {
                    const cfg = typeConfig[n.type]!
                    const isAi = ['booking', 'lead', 'escalation'].includes(n.type)
                    const Icon = isAi ? Bot : cfg.icon
                    
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "group relative flex items-start gap-4 rounded-[16px] p-4 transition-all cursor-pointer border border-transparent",
                          n.is_read
                            ? "hover:bg-gray-50"
                            : "bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                        )}
                      >
                        {!n.is_read && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                        
                        {/* Icon */}
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full ml-1", 
                          isAi ? "bg-[#c65f39]/10 text-[#c65f39]" : cfg.bg + " " + cfg.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={cn("text-[14px] font-medium leading-snug", n.is_read ? "text-gray-700" : "text-gray-900")}>
                              {n.title}
                            </p>
                            <span className="text-[11px] font-medium text-gray-400 shrink-0 mt-0.5">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          
                          <p className={cn("text-[13px] leading-relaxed line-clamp-2", n.is_read ? "text-gray-500" : "text-gray-600")}>
                            {n.message}
                          </p>

                          {n.link && (
                            <div className="mt-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[12px] font-semibold text-[#c65f39]">View details</span>
                              <ExternalLink className="h-3 w-3 text-[#c65f39]" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50/80 border-t border-gray-100 p-3 flex justify-center shadow-[0_-4px_12px_rgba(0,0,0,0.01)] z-10">
                <Link 
                  href="/settings/notifications" 
                  onClick={() => setOpen(false)}
                  className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors py-1 px-3 rounded-lg hover:bg-gray-200/50"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
