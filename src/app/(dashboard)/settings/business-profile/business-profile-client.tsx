"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2, MapPin, Phone, Mail, Globe, Clock, Plus, Trash2,
  Wifi, Sparkles, Building2, DollarSign, AtSign, Link2, Hash, Tag,
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

const AMENITIES_LIST = [
  { key: "general_construction", label: "General Construction" },
  { key: "architectural_design", label: "Architectural Design" },
  { key: "interior_design", label: "Interior Design" },
  { key: "lighting_design", label: "Lighting Design" },
  { key: "cctv_installation", label: "CCTV Installation" },
  { key: "electrical_plumbing", label: "Electrical & Plumbing" },
  { key: "planning_estimation", label: "Planning & Estimation" },
  { key: "budgeting", label: "Budgeting" },
  { key: "property_management", label: "Property Management" },
  { key: "residential_construction", label: "Residential Construction" },
  { key: "commercial_construction", label: "Commercial Construction" },
  { key: "home_automation", label: "Home Automation" },
  { key: "solar_integration", label: "Solar Integration" },
  { key: "wifi", label: "WiFi" },
  { key: "parking", label: "Parking" },
  { key: "restaurant", label: "Restaurant" },
  { key: "pet_friendly", label: "Pet Friendly" },
  { key: "outdoor_seating", label: "Outdoor Seating" },
  { key: "online_booking", label: "Online Booking" },
  { key: "telehealth", label: "Telehealth" },
  { key: "delivery", label: "Delivery" },
  { key: "takeaway", label: "Takeaway" },
]

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
  const [isSaving, setIsSaving] = useState(false)
  const [servicesOffered, setServicesOffered] = useState(initialServicesOffered)
  const [profile, setProfile] = useState<BusinessProfile>({
    workspace_id: workspaceId,
    contact: initialProfile.contact || { phone: "", email: "", address: "", google_maps_link: "" },
    social: initialProfile.social || { instagram: "", facebook: "", twitter: "", linkedin: "", youtube: "", whatsapp: "" },
    hours: initialProfile.hours || { daily: {} },
    amenities: initialProfile.amenities || [],
    policies: initialProfile.policies || {},
    pricing: initialProfile.pricing || { description: "", currency: "INR" },
    extras: initialProfile.extras || {},
  })

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
    
    // Save the services_offered directly to the workspaces table
    const supabase = createClient()
    await supabase.from("workspaces")
      .update({ services_offered: servicesOffered } as any)
      .eq("id", workspaceId)

    // Save the JSONB profile
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
    setIsSaving(false)
  }

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
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Contact Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Public Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input 
                    value={profile.contact?.phone} 
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
                    value={profile.contact?.email} 
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
                  value={profile.contact?.address} 
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
                  value={profile.contact?.google_maps_link} 
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
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Operating Hours</h2>
            </div>

            <div className="space-y-4">
              {DAYS.map(day => {
                const hours = profile.hours || { daily: {} }
                const daily = hours.daily as Record<string, any>
                const dayData = daily[day] || { open: "09:00", close: "17:00", closed: false }
                
                return (
                  <div key={day} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 text-xs font-bold text-gray-900 capitalize">{DAY_LABELS[day]}</div>
                      <input 
                        type="checkbox" 
                        checked={!dayData.closed} 
                        onChange={e => {
                          const newDaily = { ...daily }
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
                            const newDaily = { ...daily }
                            newDaily[day] = { ...dayData, open: e.target.value }
                            setNestedField("hours", "daily", newDaily)
                          }}
                          className="h-9 w-24 text-center text-xs rounded-lg border-gray-100 bg-white" 
                        />
                        <span className="text-gray-300">to</span>
                        <Input 
                          value={dayData.close || ""} 
                          onChange={e => {
                            const newDaily = { ...daily }
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
          {/* Amenities & Services */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-8">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Services Offered</h2>
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
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Additional Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(item => {
                      const isActive = profile.amenities?.includes(item.label)
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            const newAmenities = isActive
                              ? profile.amenities?.filter(a => a !== item.label)
                              : [...(profile.amenities || []), item.label]
                            setField("amenities", newAmenities)
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                            isActive 
                              ? "bg-[#c65f39] border-[#c65f39] text-white shadow-md shadow-[#c65f39]/20" 
                              : "bg-gray-50/50 border-gray-100 text-gray-500 hover:bg-white hover:border-gray-200"
                          )}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
             </div>

             <div className="pt-8 border-t border-gray-100 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Business Policies</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {POLICY_PRESETS.map(item => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{item.label}</Label>
                      <Textarea 
                        value={(profile.policies || {})[item.key] || ""}
                        onChange={e => {
                          const newPolicies = { ...(profile.policies || {}) }
                          newPolicies[item.key] = e.target.value
                          setField("policies", newPolicies)
                        }}
                        placeholder={`Describe your ${item.label.toLowerCase()}...`}
                        className="min-h-[80px] rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
             </div>
          </Card>

          {/* Social Media */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Social Media</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: "facebook", label: "Facebook", icon: "facebook" },
                { key: "instagram", label: "Instagram", icon: "instagram" },
                { key: "linkedin", label: "LinkedIn", icon: "linkedin" },
                { key: "youtube", label: "YouTube", icon: "youtube" },
                { key: "twitter", label: "Twitter / X", icon: "twitter" },
                { key: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
              ].map(sm => (
                <div key={sm.key} className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">{sm.label}</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                      value={(profile.social as any)?.[sm.key] || ""}
                      onChange={e => setNestedField("social", sm.key, e.target.value)}
                      placeholder={`${sm.label} URL...`}
                      className="h-11 pl-10 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pricing & Extras */}
          <Card className="p-8 border-gray-100 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Pricing & Currency</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Currency</Label>
                  <Input 
                    value={profile.pricing?.currency}
                    onChange={e => setNestedField("pricing", "currency", e.target.value)}
                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 text-sm font-bold" 
                  />
               </div>
               <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">General Pricing Note</Label>
                  <Input 
                    value={profile.pricing?.description}
                    onChange={e => setNestedField("pricing", "description", e.target.value)}
                    placeholder="e.g. Prices exclude 18% GST"
                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 text-sm" 
                  />
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
