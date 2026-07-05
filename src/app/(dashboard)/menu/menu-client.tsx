"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, Plus, Search, XCircle, Edit3, Trash2,
  ChevronDown, ChevronUp, Loader2, Tag, Layers
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

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  is_available: boolean | null
  stock_count: number | null
  image_url: string | null
  created_at: string | null
}

interface MenuMedia {
  id: string
  file_name: string
  file_path: string
  file_type: string
  created_at: string | null
}

const CATEGORIES = ["Food", "Beverage", "Dessert", "Service", "Other"]

export function MenuClient({
  initialItems,
  initialMedia,
}: {
  initialItems: MenuItem[]
  initialMedia: MenuMedia[]
}) {
  const [items, setItems] = useState(initialItems)
  const [media, setMedia] = useState(initialMedia)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const router = useRouter()

  const formDefault = { name: "", description: "", price: "", category: "Food", is_available: true, stock_count: "" }
  const [form, setForm] = useState(formDefault)

  const summary = useMemo(() => ({
    total: items.length,
    available: items.filter(i => i.is_available !== false).length,
    outOfStock: items.filter(i => i.is_available === false).length,
    lowStock: items.filter(i => i.is_available !== false && (i.stock_count ?? 999) > 0 && (i.stock_count ?? 999) <= 5).length,
  }), [items])

  const filtered = useMemo(() => {
    let list = items
    if (activeTab === "available") list = list.filter(i => i.is_available !== false)
    else if (activeTab === "out") list = list.filter(i => i.is_available === false)
    else if (activeTab === "low") list = list.filter(i => i.is_available !== false && (i.stock_count ?? 999) > 0 && (i.stock_count ?? 999) <= 5)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [items, activeTab, search])

  const openCreate = () => {
    setForm(formDefault)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category || "Food",
      is_available: item.is_available !== false,
      stock_count: item.stock_count !== null ? String(item.stock_count) : "",
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || Number(form.price) <= 0) {
      toast.error("Name and valid price are required")
      return
    }
    setSaving(true)
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      category: form.category || undefined,
      is_available: form.is_available,
    }
    if (form.stock_count !== "") body.stock_count = Number(form.stock_count)

    try {
      if (editingId) {
        const res = await fetch("/api/menu", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, id: editingId }),
        })
        const data = await res.json()
        if (res.ok) {
          setItems(prev => prev.map(i => i.id === editingId ? { ...i, ...data.item } : i))
          toast.success("Item updated")
        } else {
          toast.error(data.error || "Failed to update")
        }
      } else {
        const res = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (res.ok) {
          setItems(prev => [...prev, data.item])
          toast.success("Item created")
        } else {
          toast.error(data.error || "Failed to create")
        }
      }
      setShowForm(false)
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast.success("Item deleted")
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete")
      }
    } catch {
      toast.error("Something went wrong")
    }
    setDeletingId(null)
  }

  const toggleAvailability = async (item: MenuItem) => {
    const newVal = !(item.is_available !== false)
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newVal } : i))
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_available: newVal }),
      })
      if (!res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: item.is_available } : i))
        toast.error("Failed to update")
      }
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: item.is_available } : i))
    }
  }

  const tabs = [
    { id: "all", label: "All Items", count: summary.total },
    { id: "available", label: "Available", count: summary.available },
    { id: "low", label: "Low Stock", count: summary.lowStock },
    { id: "out", label: "Out of Stock", count: summary.outOfStock },
  ]

  return (
    <div className="p-4 md:p-6 max-w-full font-sans pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Menu & Inventory</h1>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              Manage products, stock levels, and availability.
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#c65f39] hover:bg-[#b85432] text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Items", value: summary.total, icon: Package, color: "text-gray-900" },
          { label: "Available", value: summary.available, icon: Tag, color: "text-emerald-600" },
          { label: "Low Stock (≤5)", value: summary.lowStock, icon: Layers, color: "text-amber-600" },
          { label: "Out of Stock", value: summary.outOfStock, icon: XCircle, color: "text-red-600" },
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-gray-50/80 rounded-xl p-1 border border-gray-100 overflow-x-auto shrink-0">
          {tabs.map(tab => (
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
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search menu..."
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
              {search ? "No items match your search" : "No menu items yet"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {search ? "Try a different search term" : "Add your first product to get started."}
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
              {filtered.map((item, index) => {
                const expanded = expandedId === item.id
                const isDeleting = deletingId === item.id
                const inStock = item.is_available !== false
                const stockLow = inStock && (item.stock_count ?? 999) > 0 && (item.stock_count ?? 999) <= 5
                const stockOut = item.is_available === false

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    <Card className="bg-white border-gray-100 shadow-sm overflow-hidden hover:border-gray-200 transition-colors">
                      <button
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            stockOut ? "bg-red-50" : stockLow ? "bg-amber-50" : "bg-emerald-50"
                          }`}>
                            <Package className={`h-4 w-4 ${
                              stockOut ? "text-red-500" : stockLow ? "text-amber-500" : "text-emerald-500"
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              {item.category && (
                                <Badge variant="outline" className="h-5 text-[9px] font-bold px-1.5 border-0 bg-gray-50 text-gray-500">
                                  {item.category}
                                </Badge>
                              )}
                              {stockOut && (
                                <Badge variant="outline" className="h-5 text-[9px] font-bold px-1.5 border-0 bg-red-50 text-red-600">
                                  Out
                                </Badge>
                              )}
                              {stockLow && (
                                <Badge variant="outline" className="h-5 text-[9px] font-bold px-1.5 border-0 bg-amber-50 text-amber-600">
                                  Low
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                              <span>₹{Number(item.price).toLocaleString()}</span>
                              {item.stock_count !== null && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span>Stock: {item.stock_count}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-gray-900">₹{Number(item.price).toLocaleString()}</span>
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
                              {item.description && (
                                <p className="text-xs text-gray-500 italic">{item.description}</p>
                              )}

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50/50 rounded-lg p-3">
                                  <span className="text-gray-400 font-medium">Price</span>
                                  <p className="font-semibold text-gray-900 mt-0.5">₹{Number(item.price).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-lg p-3">
                                  <span className="text-gray-400 font-medium">Stock</span>
                                  <p className="font-semibold text-gray-900 mt-0.5">{item.stock_count ?? "—"}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-lg p-3">
                                  <span className="text-gray-400 font-medium">Category</span>
                                  <p className="font-semibold text-gray-900 mt-0.5">{item.category || "—"}</p>
                                </div>
                                <div className="bg-gray-50/50 rounded-lg p-3">
                                  <span className="text-gray-400 font-medium">Status</span>
                                  <p className={`font-semibold mt-0.5 ${inStock ? "text-emerald-600" : "text-red-600"}`}>
                                    {inStock ? "Available" : "Unavailable"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1 items-center">
                                <Button
                                  onClick={() => openEdit(item)}
                                  className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-8 px-3.5 text-[10px] font-bold shadow-sm gap-1.5"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>

                                <Button
                                  onClick={() => toggleAvailability(item)}
                                  variant="outline"
                                  className={`rounded-xl h-8 px-3.5 text-[10px] font-bold gap-1.5 ${
                                    inStock
                                      ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  }`}
                                >
                                  {inStock ? "Mark Unavailable" : "Mark Available"}
                                </Button>

                                <Button
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  disabled={isDeleting}
                                  variant="outline"
                                  className="rounded-xl h-8 px-3.5 text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                >
                                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  Delete
                                </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false) }}>
        <DialogContent className="bg-white rounded-3xl sm:max-w-md p-6 border-gray-100 shadow-2xl font-sans text-gray-900">
          <DialogHeader className="space-y-2 pb-4 border-b border-gray-50">
            <DialogTitle className="text-lg font-bold text-gray-900 tracking-tight text-left">
              {editingId ? "Edit Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium text-left">
              {editingId ? "Update the product details below." : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-9 mt-1 bg-white border-gray-100 rounded-xl text-xs font-medium"
                placeholder="Product name"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="h-9 mt-1 bg-white border-gray-100 rounded-xl text-xs font-medium"
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="h-9 mt-1 bg-white border-gray-100 rounded-xl text-xs font-medium"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock Count</label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock_count}
                  onChange={e => setForm(f => ({ ...f, stock_count: e.target.value }))}
                  className="h-9 mt-1 bg-white border-gray-100 rounded-xl text-xs font-medium"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="h-9 w-full mt-1 bg-white border border-gray-100 rounded-xl text-xs font-medium px-3 text-gray-900"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#c65f39] focus:ring-[#c65f39]"
                  />
                  <span className="text-[10px] font-bold text-gray-500">Available</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1 rounded-xl h-10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#c65f39] hover:bg-[#b85432] text-white rounded-xl h-10 text-xs font-bold gap-2"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {editingId ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
        <DialogContent className="bg-white rounded-3xl sm:max-w-sm p-6 border-gray-100 shadow-2xl font-sans text-gray-900">
          <DialogHeader className="space-y-2 pb-4 border-b border-gray-50">
            <DialogTitle className="text-lg font-bold text-gray-900 tracking-tight text-left">Delete Item</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium text-left">
              This will permanently remove this item from the menu. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setConfirmDeleteId(null)}
              variant="outline"
              className="flex-1 rounded-xl h-10 text-xs font-bold"
            >
              Keep Item
            </Button>
            <Button
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deletingId !== null}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 text-xs font-bold gap-2"
            >
              {deletingId !== null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
