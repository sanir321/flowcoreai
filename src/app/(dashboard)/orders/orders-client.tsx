"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp, Phone } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled"

interface Order {
  id: string
  order_number: string
  status: OrderStatus
  items: any[]
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

const statusColors: Record<OrderStatus, string> = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  paid: "text-green-600 bg-green-50 border-green-200",
  fulfilled: "text-gray-500 bg-gray-50 border-gray-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
}

const statusIcons: Record<OrderStatus, any> = {
  pending: Clock,
  paid: CheckCircle,
  fulfilled: CheckCircle,
  cancelled: XCircle,
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id)
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
      if (status === "paid") toast.success("Payment verified — customer notified")
      else if (status === "fulfilled") toast.success("Order marked fulfilled")
      else if (status === "cancelled") toast.success("Order cancelled")
      router.refresh()
    } else {
      toast.error(data.error || "Failed to update order")
    }
    setUpdatingId(null)
  }

  const summary = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    paid: orders.filter(o => o.status === "paid").length,
    fulfilled: orders.filter(o => o.status === "fulfilled").length,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-32">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Orders</h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          View and manage all customer orders placed via WhatsApp.
        </p>
      </div>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: summary.total },
          { label: "Pending", value: summary.pending },
          { label: "Paid", value: summary.paid },
          { label: "Fulfilled", value: summary.fulfilled },
        ].map(s => (
          <Card key={s.label} className="p-5 bg-white border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No orders yet.</p>
        ) : (
          orders.map(order => {
            const StatusIcon = statusIcons[order.status] || Clock
            const expanded = expandedId === order.id
            const isUpdating = updatingId === order.id

            return (
              <Card key={order.id} className="bg-white border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColors[order.status] || ""}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {order.status.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-2">
                        <span>
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {order.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {order.customer_phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-gray-900">₹{Number(order.total ?? 0).toLocaleString()}</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-gray-50 space-y-4">
                        <div className="space-y-2">
                          {(order.items || []).map((item: any, idx: number) => (
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

                        <div className="flex justify-between text-base font-bold text-gray-900">
                          <span>Total</span>
                          <span>₹{Number(order.total ?? 0).toLocaleString()}</span>
                        </div>

                        {order.notes && (
                          <div className="text-xs text-gray-500 italic">
                            Notes: {order.notes}
                          </div>
                        )}

                        {order.payment_verified_at && (
                          <p className="text-[10px] text-green-600 font-medium">
                            Payment verified on {new Date(order.payment_verified_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 pt-2 items-center">
                          {order.status === "pending" && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={false}
                                disabled={isUpdating}
                                onChange={() => updateStatus(order.id, "paid")}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-xs font-bold text-gray-700">Payment verified</span>
                              {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                            </label>
                          )}

                          {order.status === "paid" && (
                            <Button
                              onClick={() => updateStatus(order.id, "fulfilled")}
                              disabled={isUpdating}
                              className="bg-green-600 text-white hover:bg-green-700 rounded-xl h-9 px-4 text-xs font-bold"
                            >
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              Mark Fulfilled
                            </Button>
                          )}

                          {(order.status === "pending" || order.status === "paid") && (
                            <Button
                              onClick={() => updateStatus(order.id, "cancelled")}
                              disabled={isUpdating}
                              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl h-9 px-4 text-xs font-bold"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
