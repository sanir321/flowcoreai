import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, Video, Building2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function formatIST(isoString: string): string {
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + IST_OFFSET);
  const datePart = ist.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const timePart = ist.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  return `${datePart} at ${timePart} IST`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: appt } = await supabase
    .from("appointments")
    .select("customer_name, service, start_at, workspace:workspaces(name)")
    .eq("id", id)
    .single()

  if (!appt) return { title: "Appointment Not Found" }

  const workspace = appt.workspace as any
  const dateStr = formatIST(appt.start_at)

  return {
    title: `Appointment Confirmed — ${workspace?.name || "FlowCore"}`,
    description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
    openGraph: {
      title: `Appointment Confirmed — ${workspace?.name || "FlowCore"}`,
      description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Appointment Confirmed — ${workspace?.name || "FlowCore"}`,
      description: `Hi ${appt.customer_name}, your ${appt.service} appointment on ${dateStr} is confirmed.`,
    },
  }
}

export default async function PublicAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  
  // Fetch appointment with workspace details
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(`
      *,
      workspace:workspaces (
        name,
        business_profile
      )
    `)
    .eq("id", id)
    .single()

  if (error || !appt) {
    notFound()
  }

  const workspace = appt.workspace as any
  const profile = workspace?.business_profile || {}
  const address = profile.contact?.address

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <Card className="max-w-md w-full p-8 shadow-xl border-none rounded-[32px] bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#f9510b]" />
        
        <div className="flex flex-col items-center text-center mb-8 pt-4">
          <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Confirmed</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed px-2">
            Hi {appt.customer_name}, your booking with <strong>{workspace?.name || "the business"}</strong> is all set.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
            <div className="mt-1">
              <Calendar className="h-5 w-5 text-[#f9510b]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatIST(appt.start_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
            <div className="mt-1">
              <Building2 className="h-5 w-5 text-[#f9510b]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{appt.service || "Consultation"}</p>
            </div>
          </div>

          {appt.meeting_link && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
              <div className="mt-1">
                <Video className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Video Meeting</p>
                <p className="text-xs font-medium text-emerald-700 mt-0.5 mb-3">Join via Google Meet</p>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold transition-all shadow-sm">
                  <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              </div>
            </div>
          )}

          {address && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
              <div className="mt-1">
                <MapPin className="h-5 w-5 text-[#f9510b]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{address}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Need to change something? Reply to our message on WhatsApp.
          </p>
        </div>
      </Card>
      
      <div className="fixed bottom-8 left-0 right-0 text-center pointer-events-none opacity-40">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Powered by FlowCore AI</p>
      </div>
    </div>
  )
}
