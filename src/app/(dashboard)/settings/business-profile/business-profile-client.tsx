"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2, MapPin, Phone, Mail, Globe, Clock, Plus,
  Sparkles, Building2, AtSign, Link2, Lightbulb, Check,
  CheckCircle2, X,
} from "lucide-react"
import { toast } from "sonner"
import { updateBusinessProfile } from "@/app/actions/business-profile"
import type { BusinessProfile } from "@/app/actions/business-profile"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
}

const AMENITIES_BY_TYPE: Record<string, string[]> = {
  restaurant: ["Dine-in", "Takeaway", "Delivery", "Reservations", "Outdoor Seating", "Private Dining", "Catering", "Full Bar", "Wifi", "Parking"],
  hotel: ["Wifi", "Parking", "Pool", "Spa", "Gym", "Room Service", "Restaurant", "Bar", "Conference Room", "Airport Shuttle", "Laundry", "Pet Friendly"],
  healthcare: ["Parking", "Wheelchair Access", "Telehealth", "Lab On-Site", "Pharmacy", "Waiting Area", "Wifi", "Insurance Accepted"],
  dental: ["Parking", "Wheelchair Access", "Telehealth", "Emergency Services", "X-Ray On-Site", "Wifi", "Insurance Accepted"],
  salon: ["Walk-ins Welcome", "Online Booking", "Wifi", "Parking", "Private Rooms", "Gift Cards"],
  fitness: ["Group Classes", "Personal Training", "Wifi", "Parking", "Lockers", "Showers", "Sauna", "Childcare"],
  retail: ["Online Ordering", "In-Store Pickup", "Delivery", "Gift Cards", "Loyalty Program", "Wifi"],
  real_estate: ["Virtual Tours", "Open Houses", "Free Consultation", "Market Analysis", "Property Management"],
  tech: ["Remote Support", "Free Consultation", "On-Site Service", "Maintenance Plans", "Cloud Hosting"],
  education: ["Online Classes", "In-Person Classes", "Group Sessions", "Private Tutoring", "Study Materials", "Wifi"],
  other: ["Wifi", "Parking", "Online Booking", "Delivery"],
}
interface Props {
  workspaceId: string
  initialProfile: BusinessProfile
  businessType: string
  initialServicesOffered?: string
  initialSuggestions?: Record<string, unknown> | null
}

export function BusinessProfileClient({ workspaceId, initialProfile, businessType, initialServicesOffered = "", initialSuggestions = null }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [servicesTags, setServicesTags] = useState<string[]>(
    initialServicesOffered ? initialServicesOffered.split(",").map(s => s.trim()).filter(Boolean) : []
  )
  const [customAmenity, setCustomAmenity] = useState("")
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  
  const defaultDaily = { open: "09:00", close: "17:00", closed: false }
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const existingDaily = initialProfile?.hours?.daily || {} as Record<string, any>
    const daily: Record<string, { open: string; close: string; closed: boolean }> = {}
    for (const day of DAYS) {
      daily[day] = existingDaily[day] || { ...defaultDaily }
    }
    return {
      workspace_id: workspaceId,
      contact: initialProfile?.contact || { phone: "", email: "", address: "", google_maps_link: "" },
      social: initialProfile?.social || { instagram: "", facebook: "", twitter: "", linkedin: "", youtube: "", whatsapp: "" },
      hours: { daily },
      amenities: initialProfile?.amenities || [],
      policies: initialProfile?.policies || {},
      pricing: initialProfile?.pricing || { description: "", currency: "INR" },
      extras: initialProfile?.extras || {},
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialServicesOffered) {
      setServicesTags(initialServicesOffered.split(",").map(s => s.trim()).filter(Boolean))
    }
  }, [initialServicesOffered])

  const setField = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const setNestedField = <K extends keyof BusinessProfile>(
    section: K,
    field: string,
    value: unknown
  ) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any || {}),
        [field]: value,
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Strip suggestion sub-object before saving — it's read-only scraped data
      const cleanProfile = { ...profile } as Record<string, unknown>
      delete cleanProfile.suggestion
      const supabase = createClient()
      await supabase.from("workspaces")
        .update({ services_offered: servicesTags.join(", ") } as any)
        .eq("id", workspaceId)

      const result = await updateBusinessProfile({
        workspace_id: workspaceId,
        profile: cleanProfile as BusinessProfile,
      })
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated successfully")
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-[#c65f39]" />
    </div>
  )

  const safeAmenities = (Array.isArray(profile.amenities) ? profile.amenities : []) as string[]
  const safeSocial = (profile.social && typeof profile.social === "object" ? profile.social : {}) as any
  const safeHours = (profile.hours && typeof profile.hours === "object" ? profile.hours : { daily: {} }) as any
  const safeDaily = (safeHours.daily && typeof safeHours.daily === "object" ? safeHours.daily : {}) as Record<string, any>
  const safeContact = (profile.contact && typeof profile.contact === "object" ? profile.contact : {}) as any

  const handleApplySuggestion = () => {
    if (!initialSuggestions) return
    const sug = initialSuggestions as Record<string, unknown>
    const newProfile = { ...profile }
    const applied = new Set(appliedSuggestions)

    for (const [key, val] of Object.entries(sug)) {
      if (key === "scraped_at" || key === "source") continue
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const existing = (newProfile as any)[key] || {}
        ;(newProfile as any)[key] = { ...existing, ...val }
      } else {
        ;(newProfile as any)[key] = val
      }
      applied.add(key)
    }

    setProfile(newProfile as BusinessProfile)
    setAppliedSuggestions(applied)
    toast.success("Suggestions applied — save to persist")
  }

  const hasSuggestions = initialSuggestions && Object.keys(initialSuggestions).some(k => k !== "scraped_at" && k !== "source")

  const suggestedAmenities = AMENITIES_BY_TYPE[businessType] || AMENITIES_BY_TYPE.other || []

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Business Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your business identity and specialist knowledge.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#c65f39] hover:bg-[#b55533] text-white rounded-xl h-11 px-8 font-semibold shadow-lg shadow-[#c65f39]/20 transition-all active:scale-95"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Contact Information */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#c65f39]">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Contact</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Public Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input 
                    value={safeContact.phone || ""} 
                    onChange={e => setNestedField("contact", "phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 pl-10 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input 
                    value={safeContact.email || ""} 
                    onChange={e => setNestedField("contact", "email", e.target.value)}
                    placeholder="hello@business.com"
                    className="h-11 pl-10 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Physical Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400" />
                <Textarea 
                  value={safeContact.address || ""} 
                  onChange={e => setNestedField("contact", "address", e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="min-h-[80px] pl-10 pt-3 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Google Maps Link</Label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input 
                  value={safeContact.google_maps_link || ""} 
                  onChange={e => setNestedField("contact", "google_maps_link", e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="h-11 pl-10 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                />
              </div>
            </div>
          </Card>

          {/* Operating Hours */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Hours</h2>
            </div>

            <div className="space-y-4">
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick set:</span>
                {[
                  { label: "9–5 weekdays", open: "09:00", close: "17:00", weekdays: true },
                  { label: "10–6 weekdays", open: "10:00", close: "18:00", weekdays: true },
                  { label: "9–9 daily", open: "09:00", close: "21:00", weekdays: false },
                  { label: "All closed", open: "09:00", close: "17:00", weekdays: false, allClosed: true },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const newDaily = { ...safeDaily }
                      for (const day of DAYS) {
                        if (preset.allClosed) {
                          newDaily[day] = { ...newDaily[day], closed: true }
                        } else if (preset.weekdays && ["saturday", "sunday"].includes(day)) {
                          newDaily[day] = { ...newDaily[day], closed: true }
                        } else {
                          newDaily[day] = { open: preset.open, close: preset.close, closed: false }
                        }
                      }
                      setNestedField("hours", "daily", newDaily)
                    }}
                    className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Copy time to all open days */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Apply first open day's hours to all:</span>
                <button
                  type="button"
                  onClick={() => {
                    const firstOpen = Object.values(safeDaily).find(d => !d.closed)
                    if (!firstOpen) return
                    const newDaily = { ...safeDaily }
                    for (const day of DAYS) {
                      if (!newDaily[day]?.closed) {
                        newDaily[day] = { open: firstOpen.open, close: firstOpen.close, closed: false }
                      }
                    }
                    setNestedField("hours", "daily", newDaily)
                    toast.success("Applied to all open days")
                  }}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#c65f39]/10 text-[#c65f39] hover:bg-[#c65f39]/20 transition-all"
                >
                  Copy hours
                </button>
              </div>

              {/* Day rows */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {DAYS.map(day => {
                  const dayData = safeDaily[day] || { open: "09:00", close: "17:00", closed: false }
                  const isOpen = !dayData.closed
                  
                  return (
                    <div key={day} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newDaily = { ...safeDaily }
                            newDaily[day] = { open: dayData.open || "09:00", close: dayData.close || "17:00", closed: !isOpen }
                            setProfile(prev => ({
                              ...prev,
                              hours: { ...(prev.hours || {}), daily: newDaily }
                            }))
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                            isOpen ? "bg-emerald-500" : "bg-gray-300"
                          )}
                          aria-pressed={isOpen}
                          aria-label={isOpen ? `Mark ${DAY_LABELS[day]} as closed` : `Mark ${DAY_LABELS[day]} as open`}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                              isOpen ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                        <span className="text-xs font-semibold text-gray-900 w-10">{DAY_LABELS[day]}</span>
                      </div>

                      {isOpen ? (
                        <div className="flex items-center gap-1.5">
                          <Input 
                            type="time"
                            value={dayData.open || "09:00"} 
                            onChange={e => {
                              const newDaily = { ...safeDaily }
                              newDaily[day] = { ...dayData, open: e.target.value }
                              setNestedField("hours", "daily", newDaily)
                            }}
                            className="h-8 w-20 text-center text-xs rounded-lg border-gray-100 bg-white" 
                            aria-label={`${DAY_LABELS[day]} opening time`}
                          />
                          <span className="text-gray-300 text-xs">–</span>
                          <Input 
                            type="time"
                            value={dayData.close || "17:00"} 
                            onChange={e => {
                              const newDaily = { ...safeDaily }
                              newDaily[day] = { ...dayData, close: e.target.value }
                              setNestedField("hours", "daily", newDaily)
                            }}
                            className="h-8 w-20 text-center text-xs rounded-lg border-gray-100 bg-white" 
                            aria-label={`${DAY_LABELS[day]} closing time`}
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Closed</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Services & Amenities */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-8">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">What We Offer</h2>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Main Services</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {servicesTags.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c65f39]/10 border border-[#c65f39]/20 text-xs font-medium text-[#c65f39]">
                        {s}
                        <button type="button" onClick={() => setServicesTags(prev => prev.filter((_, j) => j !== i))} className="hover:text-[#b55533]">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a service and press Enter..."
                      className="h-10 text-sm rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                      onKeyDown={e => {
                        const input = e.currentTarget
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const val = input.value.trim()
                          if (val && !servicesTags.includes(val)) {
                            setServicesTags(prev => [...prev, val])
                          }
                          input.value = ""
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">This list will be directly read by the AI Booking Agent to offer options to the customer.</p>
                </div>

                <div className="pt-4 space-y-3">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Amenities</Label>
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1 pb-2">
                    {suggestedAmenities.map(item => {
                      const isActive = safeAmenities.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const newAmenities = isActive
                              ? safeAmenities.filter(a => a !== item)
                              : [...safeAmenities, item]
                            setField("amenities", newAmenities)
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0",
                            isActive 
                              ? "bg-[#c65f39] border-[#c65f39] text-white shadow-md shadow-[#c65f39]/20" 
                              : "bg-gray-50/50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200"
                          )}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={customAmenity}
                      onChange={e => setCustomAmenity(e.target.value)}
                      placeholder="Add custom amenity..."
                      className="h-9 text-xs rounded-lg"
                      onKeyDown={e => {
                        if (e.key === "Enter" && customAmenity.trim()) {
                          e.preventDefault()
                          if (!safeAmenities.includes(customAmenity.trim())) {
                            setField("amenities", [...safeAmenities, customAmenity.trim()])
                          }
                          setCustomAmenity("")
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => {
                        if (customAmenity.trim() && !safeAmenities.includes(customAmenity.trim())) {
                          setField("amenities", [...safeAmenities, customAmenity.trim()])
                          setCustomAmenity("")
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
             </div>
          </Card>

          {/* Social Media */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Social</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: "facebook", label: "Facebook" },
                { key: "instagram", label: "Instagram" },
                { key: "linkedin", label: "LinkedIn" },
                { key: "youtube", label: "YouTube" },
                { key: "twitter", label: "Twitter / X" },
                { key: "whatsapp", label: "WhatsApp" },
              ].map(sm => (
                <div key={sm.key} className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{sm.label}</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                      value={(safeSocial as any)?.[sm.key] || ""}
                      onChange={e => setNestedField("social", sm.key, e.target.value)}
                      placeholder={`${sm.label} URL...`}
                      className="h-11 pl-10 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Suggestions from Website Scrape */}
          {hasSuggestions && (
            <Card className="p-8 border-amber-100 rounded-[2rem] shadow-sm space-y-6 bg-amber-50/30">
              <button
                type="button"
                onClick={() => setSuggestionsOpen(!suggestionsOpen)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Suggestions from your website</h2>
                    <p className="text-xs text-gray-500">Auto-detected — review and apply, or ignore</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{suggestionsOpen ? "▲" : "▼"}</span>
              </button>

              {suggestionsOpen && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(initialSuggestions as Record<string, unknown>)
                      .filter(([k]) => k !== "scraped_at" && k !== "source")
                      .map(([key, val]) => {
                        const label = key.charAt(0).toUpperCase() + key.slice(1)
                        const display = typeof val === "object" ? JSON.stringify(val, null, 1).slice(0, 200) : String(val)
                        return (
                          <div key={key} className="flex items-start justify-between p-3 rounded-xl bg-white border border-amber-100">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                              <p className="text-sm text-gray-700 mt-0.5 break-words">{display}</p>
                            </div>
                            {appliedSuggestions.has(key) ? (
                              <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-600 px-3 py-1.5 rounded-lg bg-emerald-50">
                                <Check className="h-3 w-3" /> Applied
                              </span>
                            ) : null}
                          </div>
                        )
                      })}
                  </div>
                  <Button
                    type="button"
                    onClick={handleApplySuggestion}
                    className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all active:scale-95"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Apply All Suggestions
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Policies — link to Knowledge Base */}
          <Card className="p-6 border-gray-100 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Policies</h2>
                <p className="text-xs text-gray-400">Add policies as Knowledge Base entries for AI to reference them.</p>
              </div>
            </div>
            <a href="/knowledge" className="mt-4 inline-flex items-center text-sm font-medium text-[#c65f39] hover:underline">
              Go to Knowledge Base →
            </a>
          </Card>
        </div>
      </div>
    </div>
  )
}
