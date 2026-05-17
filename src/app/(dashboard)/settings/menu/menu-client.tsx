"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  is_available: boolean
}

interface MenuClientProps {
  initialItems: MenuItem[]
}

const defaultForm = { name: "", description: "", price: 0, category: "" }

export function MenuClient({ initialItems }: MenuClientProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState("")
  const router = useRouter()

  const filtered = search
    ? items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category || "").toLowerCase().includes(search.toLowerCase())
      )
    : items

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleAdd = async () => {
    if (!form.name || form.price <= 0) {
      toast.error("Name and valid price required")
      return
    }
    setLoading(true)
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        category: form.category || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Failed to add item")
    } else {
      setItems(prev => [...prev, data.item])
      toast.success("Menu item added")
      resetForm()
      router.refresh()
    }
    setLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingId || !form.name || form.price <= 0) {
      toast.error("Name and valid price required")
      return
    }
    setLoading(true)
    const res = await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        category: form.category || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Failed to update item")
    } else {
      setItems(prev => prev.map(i => (i.id === editingId ? { ...i, ...data.item } : i)))
      toast.success("Menu item updated")
      resetForm()
      router.refresh()
    }
    setLoading(false)
  }

  const handleToggle = async (item: MenuItem) => {
    const res = await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_available: !item.is_available }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)))
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success("Menu item deleted")
      router.refresh()
    } else {
      toast.error("Failed to delete")
    }
  }

  const startEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description || "", price: item.price, category: item.category || "" })
    setEditingId(item.id)
    setShowForm(true)
  }

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[]

  return (
    <div className="max-w-4xl space-y-8 font-sans pb-32">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Menu</h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Manage your product catalog. Customers can browse and order via WhatsApp.
        </p>
      </div>

      <hr className="border-gray-100" />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="pl-9 h-10 border-gray-200 bg-gray-50/30 text-sm"
          />
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-black text-white hover:bg-gray-800 rounded-xl h-10 px-5 text-xs font-bold"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white border-gray-100 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-gray-900">
            {editingId ? "Edit Menu Item" : "Add Menu Item"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Root Canal Treatment"
                className="h-10 border-gray-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price || ""}
                onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 4999"
                className="h-10 border-gray-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</Label>
              <Input
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="e.g. Dental, General Checkup"
                className="h-10 border-gray-200 text-sm"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</Label>
              <Input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description (optional)"
                className="h-10 border-gray-200 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              onClick={resetForm}
              className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl h-9 px-5 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800 rounded-xl h-9 px-5 text-xs font-bold"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            {search ? "No items match your search." : "No menu items yet. Add your first product above."}
          </p>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.is_available ? "bg-green-400" : "bg-gray-300"}`} />
                  <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                  {item.category && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      {item.category}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5 ml-4 truncate">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span className="text-sm font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
                <button
                  onClick={() => handleToggle(item)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors ${
                    item.is_available
                      ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                      : "text-gray-400 border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {item.is_available ? "Live" : "Hidden"}
                </button>
                <button onClick={() => startEdit(item)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
