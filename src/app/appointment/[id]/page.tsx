import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, Video, Building2, CheckCircle2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function formatISTDate(isoString: string): string {
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + IST_OFFSET);
  return ist.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatISTTime(isoString: string): string {
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + IST_OFFSET);
  return ist.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: appt } = await supabase
    .rpc("get_public_appointment", { p_appointment_id: id })
    .single()

  if (!appt) return { title: "Appointment Not Found" }

  const dateStr = formatISTDate(appt.start_at)

  return {
    title: `Appointment Confirmed — ${appt.workspace_name || "Flowcore"}`,
    description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
    openGraph: {
      title: `Appointment Confirmed — ${appt.workspace_name || "Flowcore"}`,
      description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Appointment Confirmed — ${appt.workspace_name || "Flowcore"}`,
      description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
    },
  }
}

export default async function PublicAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: appt, error } = await supabase
    .rpc("get_public_appointment", { p_appointment_id: id })
    .single()

  if (error || !appt) {
    notFound()
  }

  const address = appt.workspace_address

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#c65f39]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[420px] w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out z-10">
        <Card className="w-full bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden relative">
          
          {/* Header Ticket Area */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calendar className="w-32 h-32 text-white transform rotate-12 scale-150" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-white/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h1 className="text-white text-2xl font-semibold tracking-tight mb-1.5">Confirmed</h1>
              <p className="text-slate-300 text-sm font-medium">Your appointment is locked in.</p>
            </div>
          </div>

          {/* Ticket Perforation */}
          <div className="relative h-6 bg-white flex items-center justify-between px-[-8px] -mt-3 z-20 overflow-visible">
            <div className="w-6 h-6 bg-[#fafafa] rounded-full -ml-3 shadow-inner" />
            <div className="w-full border-t-2 border-dashed border-slate-200/60 mx-2" />
            <div className="w-6 h-6 bg-[#fafafa] rounded-full -mr-3 shadow-inner" />
          </div>

          {/* Details Body */}
          <div className="p-8 pt-4 space-y-7">
            {/* User & Service info */}
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Customer</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-base font-medium text-slate-900">{appt.customer_name}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Service</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#c65f39]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#c65f39]" />
                  </div>
                  <p className="text-base font-medium text-slate-900">{appt.service || "Consultation"}</p>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100" />

            {/* Time info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatISTDate(appt.start_at)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time (IST)</p>
                <p className="text-sm font-semibold text-slate-900">{formatISTTime(appt.start_at)}</p>
              </div>
            </div>

            {/* Meeting Link */}
            {appt.meeting_link && (
              <div className="group relative bg-emerald-50/50 hover:bg-emerald-50 transition-colors p-5 rounded-2xl border border-emerald-100/50 flex flex-col gap-3 items-center text-center mt-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1 shadow-sm">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 mb-1">Google Meet Video Call</p>
                  <p className="text-xs text-emerald-600/80 font-medium mb-4">Click below to join the meeting at the scheduled time.</p>
                </div>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(5,150,105,0.39)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.23)] hover:-translate-y-0.5">
                  <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer">
                    Join Meeting Now
                  </a>
                </Button>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-2">
                <div className="mt-0.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{address}</p>
                </div>
              </div>
            )}

          </div>
          
          <div className="bg-slate-50/50 p-5 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Need changes? Reply directly on WhatsApp.
            </p>
          </div>
        </Card>
        
        <div className="mt-8 flex justify-center opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Powered by</span>
            <svg width="84" height="21" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c65f39"/>
                  <stop offset="100%" stopColor="#a84a2a"/>
                </linearGradient>
              </defs>
              <rect x="10" y="22" width="56" height="56" rx="14" fill="url(#brand)"/>
              <path d="M24 32h28v5H29v5h16v5H29v10h5v5H24V32z" fill="#fff"/>
              <text x="80" y="62" fontFamily="sans-serif" fontSize="38" fill="#1a1a1a">
                <tspan fontWeight="700">Flow</tspan><tspan fontWeight="300" fill="#555">Core</tspan>
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
