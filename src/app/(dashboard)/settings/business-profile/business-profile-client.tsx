"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2, MapPin, Phone, Mail, Globe, Clock, Plus, Trash2,
  Sparkles, Building2, AtSign, Link2,
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
  clinic: ["Parking", "Wheelchair Access", "Telehealth", "Lab On-Site", "Pharmacy", "Waiting Area", "Wifi", "Insurance Accepted"],
  dental: ["Parking", "Wheelchair Access", "Telehealth", "Emergency Services", "X-Ray On-Site", "Wifi", "Insurance Accepted"],
  salon: ["Walk-ins Welcome", "Online Booking", "Wifi", "Parking", "Private Rooms", "Gift Cards"],
  fitness: ["Group Classes", "Personal Training", "Wifi", "Parking", "Lockers", "Showers", "Sauna", "Childcare"],
  retail: ["Online Ordering", "In-Store Pickup", "Delivery", "Gift Cards", "Loyalty Program", "Wifi"],
  real_estate: ["Virtual Tours", "Open Houses", "Free Consultation", "Market Analysis", "Property Management"],
  tech: ["Remote Support", "Free Consultation", "On-Site Service", "Maintenance Plans", "Cloud Hosting"],
  education: ["Online Classes", "In-Person Classes", "Group Sessions", "Private Tutoring", "Study Materials", "Wifi"],
  other: ["Wifi", "Parking", "Online Booking", "Delivery"],
}

const POLICY_PRESETS = [
  { key: "privacy", label: "Privacy Policy" },
  { key: "payment", label: "Payment Policy" },
  { key: "cancellation", label: "Cancellation Policy" },
  { key: "return", label: "Return / Refund Policy" },
  { key: "warranty", label: "Warranty Policy" },
  { key: "appointment", label: "Appointment / Booking Policy" },
  { key: "hygiene", label: "Hygiene & Safety Policy" },
  { key: "pets", label: "Pet Policy" },
  { key: "smoking", label: "Smoking Policy" },
  { key: "membership", label: "Membership Terms" },
]

interface Props {
  workspaceId: string
  initialProfile: BusinessProfile
  businessType: string
  initialServicesOffered?: string
}

export function BusinessProfileClient({ workspaceId, initialProfile, businessType, initialServicesOffered = "" }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [servicesOffered, setServicesOffered] = useState(initialServicesOffered)
  const [customAmenity, setCustomAmenity] = useState("")
  
  const [profile, setProfile] = useState<BusinessProfile>(() => ({
    workspace_id: workspaceId,
    contact: initialProfile?.contact || { phone: "", email: "", address: "", google_maps_link: "" },
    social: initialProfile?.social || { instagram: "", facebook: "", twitter: "", linkedin: "", youtube: "", whatsapp: "" },
    hours: initialProfile?.hours || { daily: {} },
    amenities: initialProfile?.amenities || [],
    policies: initialProfile?.policies || {},
    pricing: initialProfile?.pricing || { description: "", currency: "INR" },
    extras: initialProfile?.extras || {},
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialServicesOffered) {
      setServicesOffered(initialServicesOffered)
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
      const supabase = createClient()
      await supabase.from("workspaces")
        .update({ services_offered: servicesOffered } as any)
        .eq("id", workspaceId)

      const result = await updateBusinessProfile({
        workspace_id: workspaceId,
        profile,
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
  const safePolicies = (profile.policies && typeof profile.policies === "object" ? profile.policies : {}) as Record<string, string>
  const safeSocial = (profile.social && typeof profile.social === "object" ? profile.social : {}) as any
  const safeHours = (profile.hours && typeof profile.hours === "object" ? profile.hours : { daily: {} }) as any
  const safeDaily = (safeHours.daily && typeof safeHours.daily === "object" ? safeHours.daily : {}) as Record<string, any>
  const safeContact = (profile.contact && typeof profile.contact === "object" ? profile.contact : {}) as any

  const suggestedAmenities = AMENITIES_BY_TYPE[businessType] || AMENITIES_BY_TYPE.other

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
              {DAYS.map(day => {
                const dayData = safeDaily[day] || { open: "09:00", close: "17:00", closed: false }
                
                return (
                  <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 text-xs font-bold text-gray-900 capitalize">{DAY_LABELS[day]}</div>
                      <input 
                        type="checkbox" 
                        checked={!dayData.closed} 
                        onChange={e => {
                          const newDaily = { ...safeDaily }
                          newDaily[day] = { ...dayData, closed: !e.target.checked }
                          setNestedField("hours", "daily", newDaily)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#c65f39] focus:ring-[#c65f39]"
                      />
                      <span className="text-[10px] text-gray-400 w-14">{dayData.closed ? "Closed" : "Open"}</span>
                    </div>

                    {!dayData.closed && (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={dayData.open || ""} 
                          onChange={e => {
                            const newDaily = { ...safeDaily }
                            newDaily[day] = { ...dayData, open: e.target.value }
                            setNestedField("hours", "daily", newDaily)
                          }}
                          className="h-9 w-24 text-center text-xs rounded-lg border-gray-100 bg-white" 
                        />
                        <span className="text-gray-300">to</span>
                        <Input 
                          value={dayData.close || ""} 
                          onChange={e => {
                            const newDaily = { ...safeDaily }
                            newDaily[day] = { ...dayData, close: e.target.value }
                            setNestedField("hours", "daily", newDaily)
                          }}
                          className="h-9 w-24 text-center text-xs rounded-lg border-gray-100 bg-white" 
                        />
                      </div>
                    )}
                  </div>
                )
              })}
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
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Main Services (Comma Separated)</Label>
                  <Textarea 
                    value={servicesOffered} 
                    onChange={e => setServicesOffered(e.target.value)}
                    placeholder="Consultation, Site Visit, Design, etc."
                    className="min-h-[80px] rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all text-sm resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 ml-1">This list will be directly read by the AI Booking Agent to offer options to the customer.</p>
                </div>

                <div className="pt-4 space-y-3">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Amenities</Label>
                  <div className="flex flex-wrap gap-2">
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
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
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
