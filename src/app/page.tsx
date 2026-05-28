"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpRight,
  Shield,
  Lock,
  Heart,
  Send,
  MessageSquare,
  Sparkles,
  Inbox,
  BarChart2,
  Users,
  CheckCircle2,
  Globe,
  FileText,
  Activity,
  ChevronDown
} from "lucide-react"
import { Input } from "@/components/ui/input"

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.717 2.009-1.41.25-.694.25-1.288.174-1.41-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const GoogleCalendarLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <rect width="24" height="24" rx="4" fill="#fff" />
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2z" fill="#4285F4" />
    <path d="M21 20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h18v11z" fill="#fff" />
    <path d="M7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" fill="#4285F4" />
  </svg>
)

const GoogleSheetsLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#0F9D58" />
    <path d="M14 2v6h6l-6-6z" fill="#B7E1CD" />
    <path d="M8 11h8v2H8zm0 4h8v2H8zm0-8h4v2H8z" fill="#fff" fillOpacity="0.8" />
  </svg>
)

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const router = useRouter()

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D95E46] selection:text-white overflow-x-hidden scroll-smooth">

      <header className="h-16 flex items-center justify-between px-6 lg:px-12 sticky top-0 bg-[#050505]/95 backdrop-blur-xl z-[100] border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="h-8 w-8 rounded-lg bg-[#D95E46] flex items-center justify-center shadow-sm hover:scale-105 transition-all duration-300">
            <span className="text-white font-bold text-sm tracking-tighter">F</span>
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tighter text-white font-outfit">
            flowcore
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <div className="relative group">
            <button className="text-sm text-neutral-400 hover:text-white transition-colors font-medium flex items-center gap-1 py-2">
              Industries <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[480px] bg-[#11100f] border border-white/5 rounded-xl shadow-2xl p-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">FlowCore by Industry</div>
                <div className="space-y-2">
                  <div className="hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="font-bold text-xs text-white">Hospitality</div>
                    <div className="text-[10px] text-neutral-500">Automate guest check-in & STR operations</div>
                  </div>
                  <div className="hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="font-bold text-xs text-white">Property Management</div>
                    <div className="text-[10px] text-neutral-500">From tour booked to lease signed</div>
                  </div>
                  <div className="hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="font-bold text-xs text-white">Home services</div>
                    <div className="text-[10px] text-neutral-500">AI that answers calls and books services</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Learn More</div>
                <div className="space-y-2">
                  <div className="hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="font-bold text-xs text-white">Book a Demo</div>
                    <div className="text-[10px] text-neutral-500">Connect with our team to see in action</div>
                  </div>
                  <div className="hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <div className="font-bold text-xs text-white">ROI Calculator</div>
                    <div className="text-[10px] text-neutral-500">Calculate FlowCore's Impact</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link href="/pricing" className="text-sm text-neutral-400 hover:text-white transition-colors font-medium">Customers</Link>
          <Link href="/pricing" className="text-sm text-neutral-400 hover:text-white transition-colors font-medium">Pricing</Link>
          <div className="relative group">
            <button className="text-sm text-neutral-400 hover:text-white transition-colors font-medium flex items-center gap-1 py-2">
              Resources <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-[#11100f] border border-white/5 rounded-xl shadow-2xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200">
              <Link href="/faq" className="block hover:bg-white/5 p-2 rounded-lg text-xs font-semibold text-white">FAQ</Link>
              <Link href="/changelog" className="block hover:bg-white/5 p-2 rounded-lg text-xs font-semibold text-white">Changelog</Link>
              <Link href="/legal" className="block hover:bg-white/5 p-2 rounded-lg text-xs font-semibold text-white">Legal</Link>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Book Demo</Link>
          <Button asChild className="rounded-lg h-9 px-4 bg-[#222222] border border-neutral-800 text-white hover:bg-neutral-800 transition-all text-xs font-medium">
             <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* HERO SECTION (Dark Theme) */}
        <section className="relative pt-32 pb-48 px-6 lg:px-12 overflow-hidden flex flex-col items-center bg-[#050505]">
          {/* Warm orange radial glows in the background */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-[#D95E46]/18 via-[#D95E46]/6 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[#D95E46]/10 rounded-full blur-[90px] pointer-events-none z-0" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-10">
            <div className="space-y-6">
               <h1 className="text-5xl sm:text-6xl lg:text-[70.5px] font-bold leading-[1.1] tracking-tighter text-white font-outfit">
                 Automated customer<br/>
                 service <span className="text-[#D95E46] italic font-outfit">assistants</span>
               </h1>
               <p className="text-lg text-neutral-400 font-medium max-w-xl mx-auto leading-relaxed">
                 Connect specialized AI to manage and resolve your customer conversations with business precision.
               </p>
            </div>

            <div className="max-w-md mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  router.push(`/login?email=${encodeURIComponent(email)}`)
                }}
                className="flex p-1 bg-white/5 border border-white/10 rounded-xl focus-within:border-[#D95E46]/30 transition-all"
              >
                 <Input 
                   type="email"
                   placeholder="you@company.com" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="bg-transparent border-none text-white h-11 px-4 focus-visible:ring-0 placeholder:text-neutral-600 text-sm"
                 />
                 <Button type="submit" className="h-11 px-6 rounded-lg bg-[#D95E46] hover:bg-[#D95E46]/90 text-white font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1">
                   Get Started <ArrowUpRight className="h-4 w-4" />
                 </Button>
              </form>
            </div>
          </div>

          {/* Landing Page Dashboard Preview Container */}
          <div className="w-full max-w-5xl px-6 relative z-30 mt-24">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#D95E46]/18 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
            <div className="bg-[#11100f] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl ring-1 ring-white/[0.02]">
              <div className="flex items-center justify-between h-10 px-5 border-b border-white/[0.06] bg-[#0c0c0b]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-neutral-800" />
                  <div className="h-2 w-2 rounded-full bg-neutral-800" />
                  <div className="h-2 w-2 rounded-full bg-neutral-800" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-md">
                  <div className="h-1 w-1 rounded-full bg-[#D95E46]" />
                  <span className="text-[9px] font-medium text-neutral-500 font-mono">app.flowcore.ai</span>
                </div>
                <div className="h-4 w-4 rounded bg-white/[0.06] flex items-center justify-center text-[7px] font-semibold text-neutral-500">F</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 h-[350px] text-xs text-neutral-400">
                <div className="border-r border-white/5 p-4 space-y-4 hidden md:block bg-[#0e0e0d]">
                  <div className="font-semibold text-neutral-200 flex items-center gap-2"><Inbox className="h-4 w-4 text-[#D95E46]" /> Inbox</div>
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white">
                      <div className="font-bold text-[11px] flex justify-between">Will Garman <span className="text-[9px] text-[#D95E46]">Active</span></div>
                      <div className="text-[10px] text-neutral-400 truncate">I was wondering if I can extend...</div>
                    </div>
                    <div className="p-2 rounded-lg opacity-40">
                      <div className="font-bold text-[11px]">Jane Doe</div>
                      <div className="text-[10px] text-neutral-400 truncate">Book a double room for next Friday</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 p-4 flex flex-col justify-between h-full bg-[#11100f]">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-[#D95E46]/20 flex items-center justify-center text-[9px] text-[#D95E46] font-bold">WG</div>
                      <div className="bg-white/5 border border-white/5 p-2.5 rounded-2xl max-w-[80%] text-neutral-300">
                        I was wondering if I can extend my upcoming stay to checkout one day later??
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="bg-[#D95E46]/10 border border-[#D95E46]/20 p-2.5 rounded-2xl max-w-[80%] text-neutral-200">
                        <span className="block text-[9px] text-[#D95E46] font-bold mb-0.5">Support Agent • Sent by AI</span>
                        Let me query availability for property 230CALST. One moment.
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white/5 rounded-xl border border-white/5 flex gap-2 items-center">
                    <input type="text" placeholder="Type a message..." className="bg-transparent flex-1 border-none focus:outline-none text-[11px] px-2 text-white" disabled />
                    <button className="bg-[#D95E46] text-white p-1 rounded-lg"><Send className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-4 hidden md:block bg-[#0e0e0d]">
                  <div className="font-semibold text-neutral-200 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-[#D95E46]" /> Analytics</div>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-neutral-500">AI Automation Rate</div>
                      <div className="text-xl font-bold text-white tracking-tight mt-0.5">70.6%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO CLOUD (Light Theme) */}
        <section className="py-16 bg-[#ffffff] border-t border-neutral-100 flex flex-col items-center">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-10 text-center font-sans">
            500+ TEAMS SUPERCHARGE THEIR SERVICE WITH FLOWCORE
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 max-w-6xl px-6 opacity-60">
            {["haus", "Hallson", "CAPITALIA", "HostGenius", "renjoy", "BOCOBAY", "Casioa", "MerchFarm", "Pass the Keys", "alloggio"].map((brand, i) => (
              <span key={i} className="text-lg font-extrabold text-neutral-900 tracking-tighter hover:opacity-100 transition-opacity select-none cursor-default font-outfit">
                {brand}
              </span>
            ))}
          </div>
        </section>

        {/* HANDLE COMMUNICATION END-TO-END (Light Theme) */}
        <section className="py-20 bg-[#ffffff] text-center px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl sm:text-[43px] font-light text-neutral-900 tracking-tight leading-tight font-outfit">
              Handle communication end-to-end
            </h2>
            <p className="text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
              FlowCore keeps your team focused by intelligently handling communications and escalating only the critical moments.
            </p>
          </div>
        </section>

        {/* SEE ROI IN 30 DAYS (Light Theme) */}
        <section className="py-24 bg-[#ffffff] text-neutral-900 border-t border-neutral-100 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="space-y-6">
              <span className="text-xs font-bold text-[#D95E46] uppercase tracking-wider">Reporting & Insights</span>
              <h2 className="text-4xl sm:text-[43px] font-normal tracking-tight leading-tight font-outfit text-neutral-900">
                See ROI in 30 days
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed max-w-md">
                AI insights to help monitor, evaluate, and continuously optimize your conversations.
              </p>
              <Button asChild className="h-11 px-6 rounded-xl bg-[#D95E46] hover:bg-[#D95E46]/90 text-white font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-1.5 w-fit">
                <Link href="/login">Book Demo <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>

            <motion.div {...fadeInUp} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xl relative overflow-hidden">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                    <span>Last 7 days</span>
                    <span className="text-neutral-400">compared to</span>
                    <span className="text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50">Previous period</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">Aug 22, 2025 - Aug 29, 2025</div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">AI automation rate</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-neutral-900 tracking-tight font-outfit">70.6%</span>
                      <span className="text-[10px] font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">-8.1%</span>
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-1">78.7% previous period</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Open ticket count</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-neutral-900 tracking-tight font-outfit">133</span>
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-1">90 previous period</div>
                  </div>
                </div>

                {/* Line Chart */}
                <div className="h-32 w-full bg-neutral-50 rounded-xl border border-neutral-200/60 overflow-hidden relative">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="light-chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10 L100,100 L0,100 Z" fill="url(#light-chart-grad)" />
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Escalations Breakdown */}
                <div className="space-y-3 pt-2">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Escalations</div>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-medium text-neutral-700"><span>AI missing info</span><span className="font-bold text-neutral-900">19 <span className="text-[10px] text-neutral-400 font-normal">(52.8%)</span></span></div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden"><div className="h-full w-[52.8%] bg-[#D95E46]" /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-medium text-neutral-700"><span>AI needs your help</span><span className="font-bold text-neutral-900">10 <span className="text-[10px] text-neutral-400 font-normal">(27.8%)</span></span></div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden"><div className="h-full w-[27.8%] bg-amber-500" /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-medium text-neutral-700"><span>Urgent tagged</span><span className="font-bold text-neutral-900">7 <span className="text-[10px] text-neutral-400 font-normal">(19.4%)</span></span></div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden"><div className="h-full w-[19.4%] bg-rose-500" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* EVERYTHING IN ONE PLACE (Light Theme) */}
        <section className="py-24 bg-[#ffffff] text-neutral-900 border-t border-neutral-100 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="space-y-6 lg:order-last">
              <span className="text-xs font-bold text-[#D95E46] uppercase tracking-wider">AI-Native Unified Inbox</span>
              <h2 className="text-4xl sm:text-[43px] font-normal tracking-tight leading-tight font-outfit text-neutral-900">
                Everything in one place
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed max-w-md">
                When automation ends, your control begins — streamline every conversation your AI can't handle in one place. Teach AI natively in the inbox and automate the future.
              </p>
              <Button asChild className="h-11 px-6 rounded-xl bg-[#D95E46] hover:bg-[#D95E46]/90 text-white font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-1.5 w-fit">
                <Link href="/login">Book Demo <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>

            <motion.div {...fadeInUp} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xl relative grid grid-cols-3 gap-4 h-[420px] text-[11px] text-neutral-600">
              {/* Inbox Details Left */}
              <div className="col-span-2 space-y-4 border-r border-neutral-100 pr-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">WG</div>
                    <div>
                      <div className="font-bold text-neutral-900">Will Garman</div>
                      <div className="text-[9px] text-neutral-400">LT 2:18 PM • YT 2:18 PM</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-neutral-50 border border-neutral-200/60 p-2.5 rounded-xl text-neutral-700 max-w-[90%]">
                      <span className="block text-[8px] text-neutral-400 uppercase font-bold mb-0.5">Will Garman</span>
                      I was wondering if I can extend my upcoming stay to checkout one day later??
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <div className="bg-[#D95E46]/5 border border-[#D95E46]/20 p-2.5 rounded-xl text-neutral-800 max-w-[90%] text-right">
                      <span className="block text-[8px] text-[#D95E46] font-bold mb-0.5">Support Agent • Sent by AI</span>
                      Let me query availability for property 230CALST. One moment.
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-600 text-[10px]">
                    ✔ Availability lookup successful. Date: 04/10/2025. Status: Available.
                  </div>
                </div>

                <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded-xl flex gap-2 items-center">
                  <input type="text" placeholder="Type a message..." className="bg-transparent flex-1 border-none focus:outline-none text-[10px] px-2 text-neutral-800" disabled />
                  <button className="bg-[#D95E46] text-white p-1 rounded-lg"><Send className="h-3 w-3" /></button>
                </div>
              </div>

              {/* Sidebar Right */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[9px] text-neutral-400 uppercase font-bold">During Stay</div>
                  <div className="flex justify-between border-b border-neutral-100 pb-1 text-[10px] font-semibold text-neutral-700">
                    <span className="text-neutral-400">BEFORE</span>
                    <span className="text-neutral-900 border-b-2 border-neutral-900">DURING</span>
                  </div>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100 text-[9px] text-neutral-500 leading-normal">
                  ✨ Will is doing pretty well. The guest is coming for an upcoming stay and wants to extend their stay.
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded text-[9px]">Access Issue</span>
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px]">Extend Request</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* INTEGRATIONS GRID (Light Theme) */}
        <section className="py-24 bg-[#ffffff] border-t border-neutral-100 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-[43px] font-normal text-neutral-900 tracking-tight leading-tight font-outfit">
                Integrate with every aspect of your tech stack
              </h2>
              <p className="text-base text-neutral-500 max-w-xl mx-auto">
                Give agents the tools to succeed, backed by enterprise-grade security and SOC 2 Type II compliance.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { logo: WhatsAppLogo, label: "WhatsApp", sub: "Connected" },
                { logo: GoogleSheetsLogo, label: "Google Sheets", sub: "Synced" },
                { logo: GoogleCalendarLogo, label: "Google Calendar", sub: "Synced" },
                { logo: () => <Globe className="h-full w-full text-neutral-600" />, label: "Webchat", sub: "Active" }
              ].map((node, i) => (
                <div key={i} className="p-6 bg-neutral-50 border border-neutral-200/80 rounded-xl flex flex-col items-center gap-4 hover:bg-neutral-100 transition-all duration-300">
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center p-2.5 shadow-sm border border-neutral-100">
                    <node.logo className="h-full w-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{node.label}</h4>
                    <p className="text-[9px] font-semibold text-neutral-400 mt-0.5">{node.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSFORM THE WAY YOUR TEAM OPERATES (Dark Theme) */}
        <section className="py-24 bg-[#050505] text-white px-6 lg:px-12 relative overflow-hidden border-t border-white/[0.04]">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#D95E46]/5 blur-[100px] rounded-full translate-x-1/2 pointer-events-none" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">LEARN MORE</span>
              <h2 className="text-4xl sm:text-[43px] font-normal tracking-tight leading-tight font-outfit text-white">
                Transform the way your team operates
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="h-11 px-6 rounded-xl bg-[#D95E46] hover:bg-[#D95E46]/90 text-white font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-1">
                  <Link href="/login">Talk to Sales <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild className="h-11 px-6 rounded-xl bg-transparent border border-neutral-800 text-white hover:bg-white/5 font-bold text-xs transition-all flex items-center gap-1">
                  <Link href="/login">Calculate your ROI <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>

            {/* Simulated Metallic Ring Design */}
            <div className="relative h-64 flex items-center justify-center lg:justify-end">
              <div className="h-48 w-48 rounded-full border-8 border-neutral-800 border-t-[#D95E46] animate-spin opacity-45" style={{ animationDuration: '8s' }} />
              <div className="absolute h-32 w-32 rounded-full border-4 border-neutral-900 border-b-[#D95E46] animate-spin opacity-20" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
            </div>
          </div>
        </section>

        {/* BUILT FOR ENTERPRISE SECURITY (Light Theme) */}
        <section className="py-24 bg-[#ffffff] text-neutral-900 border-t border-neutral-100 px-6 lg:px-12 text-center">
          <div className="max-w-7xl mx-auto space-y-16">
            <h2 className="text-4xl sm:text-[43px] font-normal text-neutral-900 tracking-tight leading-tight font-outfit">
              Built for Enterprise Security and Privacy
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-4 text-left shadow-sm">
                <div className="h-10 w-10 bg-[#D95E46]/10 rounded-xl flex items-center justify-center text-[#D95E46]"><Shield className="h-5 w-5" /></div>
                <h3 className="text-base font-bold text-neutral-900">SOC Type II</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  FlowCore meets SOC 2 Type II standards, ensuring secure handling of customer data across all AI-powered support and sales operations.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-4 text-left shadow-sm">
                <div className="h-10 w-10 bg-[#D95E46]/10 rounded-xl flex items-center justify-center text-[#D95E46]"><Heart className="h-5 w-5" /></div>
                <h3 className="text-base font-bold text-neutral-900">HIPAA</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  FlowCore is designed to support HIPAA-regulated workflows and implements administrative and technical safeguards to protect customer data.
                </p>
              </div>
              <div className="p-8 rounded-2xl border border-neutral-200 bg-white space-y-4 text-left shadow-sm">
                <div className="h-10 w-10 bg-[#D95E46]/10 rounded-xl flex items-center justify-center text-[#D95E46]"><Lock className="h-5 w-5" /></div>
                <h3 className="text-base font-bold text-neutral-900">Enterprise Security Controls</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  End-to-end encryption, role-based access, audit logs, and secure model orchestration across all AI agents.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#ffffff] text-neutral-900 border-t border-neutral-200/80 pt-16 pb-10 px-4 lg:px-12 relative z-50">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16 text-sm text-neutral-600">
            <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-6">
               <div className="flex items-center gap-2.5">
                  <Link href="/" className="h-8 w-8 rounded-lg bg-[#D95E46] flex items-center justify-center shadow-sm hover:scale-105 transition-all duration-300">
                     <span className="text-white font-bold text-sm tracking-tighter">F</span>
                  </Link>
                  <Link href="/" className="text-xl font-bold tracking-tighter text-neutral-900 font-outfit">
                     flowcore
                  </Link>
               </div>
               <p className="max-w-xs leading-relaxed text-neutral-500 text-xs font-medium">AI automation that transforms business communication.</p>
               
               <div className="space-y-1 text-xs text-neutral-500 font-semibold select-all">
                 <p>Contact: support@flowcore.ai</p>
                 <p className="text-[10px] text-neutral-400">@useflowcore</p>
               </div>

               {/* Newsletter Form */}
               <div className="space-y-2 max-w-sm">
                 <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Join our newsletter</div>
                 <form onSubmit={(e) => e.preventDefault()} className="flex p-1 bg-neutral-50 border border-neutral-200 rounded-xl max-w-xs">
                   <Input type="email" placeholder="Email" className="bg-transparent border-none text-neutral-800 h-9 px-3 focus-visible:ring-0 placeholder:text-neutral-400 text-xs" />
                   <Button type="submit" className="h-9 px-4 rounded-lg bg-[#D95E46] hover:bg-[#D95E46]/90 text-white font-semibold text-xs transition-all">Submit</Button>
                 </form>
               </div>
            </div>
            
             <div className="space-y-4 text-neutral-500">
                 <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Technology</h4>
                 <nav className="flex flex-col gap-3 font-semibold">
                    <Link href="/agent-hub" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for Consumer</Link>
                    <Link href="/knowledge" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for Marketplaces</Link>
                    <Link href="/pricing" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for E-Commerce</Link>
                    <Link href="/changelog" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for Banking</Link>
                 </nav>
             </div>

             <div className="space-y-4 text-neutral-500">
                 <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Real Estate</h4>
                 <nav className="flex flex-col gap-3 font-semibold">
                    <Link href="/login" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for Housing</Link>
                    <Link href="/faq" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for Hotels</Link>
                    <Link href="/settings/integrations" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">FlowCore for STR</Link>
                 </nav>
             </div>

             <div className="space-y-4 text-neutral-500">
                 <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Company</h4>
                 <nav className="flex flex-col gap-3 font-semibold">
                    <Link href="/login" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">About</Link>
                    <Link href="/pricing" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">Customers</Link>
                    <Link href="/faq" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">Product Tour</Link>
                    <Link href="/changelog" className="hover:text-neutral-900 transition-colors text-neutral-500 text-xs">Careers</Link>
                 </nav>
             </div>
         </div>

         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-neutral-200/80 pt-6 gap-6 text-[10px] font-bold text-neutral-500">
             <nav className="flex gap-6">
                <Link href="/legal/privacy-policy" className="hover:text-neutral-900 transition-colors">Privacy</Link>
                <Link href="/legal/terms" className="hover:text-neutral-900 transition-colors">Terms & Conditions</Link>
                <Link href="/legal/cookie-policy" className="hover:text-neutral-900 transition-colors">Consent Preferences</Link>
             </nav>
             
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 rounded bg-neutral-100 border border-neutral-200 text-[8px] font-bold text-neutral-500 tracking-wider">SOC 2 TYPE II</div>
                  <div className="px-2 py-1 rounded bg-neutral-100 border border-neutral-200 text-[8px] font-bold text-neutral-500 tracking-wider">HIPAA COMPLIANT</div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 font-semibold tracking-tight">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   Verified Connection
                </div>
                <span className="tracking-tight text-neutral-400 font-medium">© 2026 FlowCore Systems</span>
             </div>
         </div>
      </footer>
    </div>
  )
}
