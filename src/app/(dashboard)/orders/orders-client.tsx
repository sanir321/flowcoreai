"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp, Phone,
  ShoppingBag, Search, Package, IndianRupee, FileText
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled"

const ALL_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled"]

interface OrderItem {
  name: string
  qty: number
  price: number
}

interface Order {
  id: string
  order_number: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  total: number
  customer_phone: string | null
  notes: string | null
  created_at: string
  contact_id: string | null
  payment_verified_at: string | null
}

interface OrdersClientProps {
  initialOrders: Order[]
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; icon: typeof Clock }> = {
  pending:    { label: "Pending",    color: "text-yellow-700",       bg: "bg-yellow-50",   dot: "bg-yellow-500",    icon: Clock },
  paid:       { label: "Paid",       color: "text-emerald-700",      bg: "bg-emerald-50",  dot: "bg-emerald-500",   icon: CheckCircle },
  fulfilled:  { label: "Fulfilled",  color: "text-blue-700",        bg: "bg-blue-50",     dot: "bg-blue-500",      icon: Package },
  cancelled:  { label: "Cancelled",  color: "text-red-700",         bg: "bg-red-50",      dot: "bg-red-500",       icon: XCircle },
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null)
  const router = useRouter()

  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    paid: orders.filter(o => o.status === "paid").length,
    fulfilled: orders.filter(o => o.status === "fulfilled").length,
  }), [orders])

  const filtered = useMemo(() => {
    let list = orders
    if (activeTab !== "all") list = list.filter(o => o.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, activeTab, search])

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id)
    setConfirmId(null)
    setConfirmStatus(null)
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
      const msgs: Record<string, string> = {
        paid: "Payment verified — customer notified",
        fulfilled: "Order marked fulfilled",
        cancelled: "Order cancelled",
      }
      toast.success(msgs[status] || "Status updated")
      router.refresh()
    } else {
      toast.error(data.error || "Failed to update order")
    }
    setUpdatingId(null)
  }

  const handleConfirmAction = (id: string, status: OrderStatus) => {
    if (status === "cancelled") {
      setConfirmId(id)
      setConfirmStatus(status)
    } else {
      updateStatus(id, status)
    }
  }

  const tabs = [
    { id: "all", label: "All Orders" },
    ...ALL_STATUSES.map(s => ({ id: s, label: statusConfig[s].label })),
  ]

  return (
    <div className="p-4 md:p-6 max-w-full font-sans pb-24">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              View and manage all customer orders placed via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Orders", value: summary.total, icon: ShoppingBag, color: "text-gray-900" },
          { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Paid", value: summary.paid, icon: IndianRupee, color: "text-emerald-600" },
          { label: "Fulfilled", value: summary.fulfilled, icon: Package, color: "text-blue-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card className="p-4 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-4 w-4 mt-0.5 ${s.color} opacity-60`} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-gray-50/80 rounded-xl p-1 border border-gray-100 overflow-x-auto shrink-0">
          {tabs.map(tab => {
            const count = tab.id === "all" ? orders.length : summary[tab.id as keyof typeof summary]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-9 bg-white border-gray-100 rounded-xl text-xs font-medium placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {search ? "No orders match your search" : `No ${activeTab === "all" ? "" : statusConfig[activeTab as OrderStatus]?.label.toLowerCase() + " "}orders yet`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {search ? "Try a different search term" : "Orders will appear here once customers place them."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <AnimatePresence>
              {filtered.map((order, index) => {
                const cfg = statusConfig[order.status]
                const StatusIcon = cfg.icon
                const expanded = expandedId === order.id
                const isUpdating = updatingId === order.id

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <Card className="bg-white border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
                      <button
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                            <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                              <Badge variant="outline" className={`h-5 text-[9px] font-bold px-1.5 border-0 ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                              <span>{relativeTime(order.created_at)}</span>
                              <span className="text-gray-200">·</span>
                              <span>{formatDate(order.created_at)}</span>
                              {order.customer_phone && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-2.5 w-2.5" />
                                    {order.customer_phone}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-gray-900">₹{Number(order.total ?? 0).toLocaleString()}</span>
                          {expanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-300" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
                              {}
                              <div className="space-y-1.5">
                                {(order.items || []).map((item: OrderItem, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">
                                      {item.name} <span className="text-gray-400">× {item.qty || 1}</span>
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      ₹{((item.qty || 1) * (item.price || 0)).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <hr className="border-gray-50" />

                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500">Subtotal</span>
                                <span className="text-sm font-medium text-gray-700">₹{Number(order.subtotal ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-base font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{Number(order.total ?? 0).toLocaleString()}</span>
                              </div>

                              {order.notes && (
                                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50/50 rounded-lg p-3">
                                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                                  <span className="italic">{order.notes}</span>
                                </div>
                              )}

                              {order.payment_verified_at && (
                                <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Payment verified on {formatDate(order.payment_verified_at)}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 pt-1 items-center">
                                {order.status === "pending" && (
                                  <Button
                                    onClick={() => handleConfirmAction(order.id, "paid")}
                                    disabled={isUpdating}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl h-8 px-3.5 text-[10px] font-bold shadow-sm gap-1.5"
                                  >
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                    Verify Payment
                                  </Button>
                                )}

                                {order.status === "paid" && (
                                  <Button
                                    onClick={() => updateStatus(order.id, "fulfilled")}
                                    disabled={isUpdating}
                                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-8 px-3.5 text-[10px] font-bold shadow-sm gap-1.5"
                                  >
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
                                    Mark Fulfilled
                                  </Button>
                                )}

                                {order.status === "fulfilled" && (
                                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-xl px-3 h-8">
                                    <CheckCircle className="h-3 w-3" />
                                    Completed
                                  </span>
                                )}

                                {order.status === "cancelled" && (
                                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-600 bg-red-50 rounded-xl px-3 h-8">
                                    <XCircle className="h-3 w-3" />
                                    Cancelled
                                  </span>
                                )}

                                {(order.status === "pending" || order.status === "paid") && (
                                  <Button
                                    onClick={() => handleConfirmAction(order.id, "cancelled")}
                                    disabled={isUpdating}
                                    variant="outline"
                                    className="rounded-xl h-8 px-3.5 text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <Dialog open={confirmId !== null} onOpenChange={(open) => { if (!open) { setConfirmId(null); setConfirmStatus(null) } }}>
        <DialogContent className="bg-white rounded-3xl sm:max-w-sm p-6 border-gray-100 shadow-2xl font-sans text-gray-900">
          <DialogHeader className="space-y-2 pb-4 border-b border-gray-50">
            <DialogTitle className="text-lg font-bold text-gray-900 tracking-tight text-left">Cancel Order</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium text-left">
              This will mark the order as cancelled. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => { setConfirmId(null); setConfirmStatus(null) }}
              variant="outline"
              className="flex-1 rounded-xl h-10 text-xs font-bold"
            >
              Keep Order
            </Button>
            <Button
              onClick={() => confirmId && confirmStatus && updateStatus(confirmId, confirmStatus)}
              disabled={updatingId !== null}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 text-xs font-bold gap-2"
            >
              {updatingId !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
