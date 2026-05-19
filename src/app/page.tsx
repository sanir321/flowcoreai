"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Lock,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  BarChart2,
  Users,
  Inbox,
  Command,
  Plus,
  Search,
  Cpu,
  Book,
  FileText,
  Bot,
  Mic,
  Workflow,
  Settings,
  Calendar,
  Table,
  Hash,
  Database,
  User,
  Zap,
  Clock,
  Send,
  Activity,
  LayoutGrid
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Parallax Transforms
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, -100])
  const dashboardY = useTransform(smoothProgress, [0, 0.3], [0, -150])
  const mockupContentY = useTransform(smoothProgress, [0.05, 0.4], [40, -100])
  const dashboardScale = useTransform(smoothProgress, [0, 0.2], [1, 1.05])
  const featuresY = useTransform(smoothProgress, [0.15, 0.5], [0, -60])
  const integrationsY = useTransform(smoothProgress, [0.35, 0.7], [0, -40])
  const footerY = useTransform(smoothProgress, [0.7, 1], [0, -20])

  // Interactive mouse glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [mouseX, mouseY])

  const glowX = useTransform(mouseX, (x) => x - 500)
  const glowY = useTransform(mouseY, (y) => y - 500)

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
  }

  const stagger = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }
  }

  const scaleOnHover = { whileHover: { scale: 1.02 }, transition: { type: "spring", stiffness: 300, damping: 15 } }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#1F1A1A] text-white font-sans selection:bg-[#D95E46] selection:text-white overflow-x-hidden scroll-smooth text-gray-300">
      {/* Global Grainy Noise */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

      {/* Navigation */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 sticky top-0 bg-[#1F1A1A]/80 backdrop-blur-xl z-[100]">
        <div className="flex-1 flex items-center text-gray-900">
          {/* FORCE_UI_REFRESH_V102 */}
          <Link href="/" className="text-2xl font-extrabold tracking-[-0.5px] text-white">flowcore</Link>
        </div>
        
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-10">
          <Link href="/pricing" className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/faq" className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">FAQ</Link>
          <Link href="/changelog" className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Changelog</Link>
          <Link href="/legal" className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Legal</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-6">
          <Link href="/login" className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors">Sign In</Link>
          <Button asChild className="rounded-xl h-10 px-6 bg-white text-black hover:bg-gray-100 transition-all active:scale-95 text-xs font-bold shadow-lg text-gray-900">
             <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Primary Hero Section */}
        <section className="relative bg-[#1F1412] pt-32 pb-40 px-6 lg:px-12 overflow-hidden border-b border-white/5 flex flex-col items-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '48px 48px' }} />
          <motion.div style={{ x: glowX, y: glowY }} className="absolute top-1/2 left-1/2 w-[1000px] h-[800px] bg-[#D95E46]/10 blur-[160px] rounded-full pointer-events-none" />

          <motion.div style={{ y: heroY }} className="max-w-4xl mx-auto text-center relative z-10 space-y-12 mb-32">
            <div className="space-y-6">
               <motion.h1 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="text-6xl lg:text-[100px] font-bold leading-[0.95] tracking-tight text-white font-sans"
               >
                 Automated customer service <br/> <span className="text-[#D95E46] italic">assistants</span>
               </motion.h1>
               <p className="text-lg lg:text-xl text-neutral-400 font-medium max-w-xl mx-auto leading-relaxed text-gray-400">
                 Connect specialized AI to manage and resolve <br/> your customer conversations with business precision.
               </p>
            </div>

            <div className="max-w-xl mx-auto relative z-20">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  router.push(`/login?email=${encodeURIComponent(email)}`)
                }}
                className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl focus-within:border-[#D95E46]/30 transition-all"
              >
                 <Input 
                   type="email"
                   placeholder="example@company.com" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="bg-transparent border-none text-white h-12 focus-visible:ring-0 placeholder:text-neutral-600 font-medium"
                 />
                 <Button type="submit" className="h-12 px-8 rounded-xl bg-[#D95E46] hover:bg-[#E2735D] text-white font-bold text-sm whitespace-nowrap active:scale-95 transition-all">
                   Get Started ↗
                 </Button>
              </form>
            </div>
          </motion.div>

          {/* High-Fidelity Dashboard Preview Overlay */}
          <motion.div style={{ y: dashboardY, scale: dashboardScale }} className="w-full max-w-6xl px-6 relative z-30">
             <div className="bg-[#FDFDFD] rounded-t-[3.5rem] border border-gray-200 shadow-[0_-40px_120px_-15px_rgba(0,0,0,0.25)] overflow-hidden h-[500px] lg:h-[800px] flex flex-col text-gray-900 ring-1 ring-black/5">
                {/* Browser Toolbar */}
                <div className="h-14 border-b border-gray-100 flex items-center px-8 justify-between bg-white relative z-[100]">
                   <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-sm opacity-80" /><div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-sm opacity-80" /><div className="h-3 w-3 rounded-full bg-[#28C840] shadow-sm opacity-80" />
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="h-7 w-56 bg-gray-50 rounded-full border border-gray-100 flex items-center px-3 gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-semibold text-gray-500">app.flowcore.ai/inbox</span>
                      </div>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-[10px] shadow-sm">JD</div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                   {/* Realistic Sidebar */}
                   <div className="w-20 border-r border-gray-100 bg-white flex flex-col items-center py-8 gap-6 hidden md:flex shrink-0 relative z-40">
                      <div className="h-11 w-11 bg-black rounded-[1.25rem] flex items-center justify-center text-[#D95E46] shadow-xl mb-4 transition-all hover:scale-105 active:scale-95 cursor-pointer"><Inbox size={20} className="stroke-[2.5]" /></div>
                      <div className="h-10 w-10 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center hover:bg-gray-50"><LayoutGrid size={18} className="stroke-[2]" /></div>
                      <div className="h-10 w-10 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center hover:bg-gray-50"><Users size={18} className="stroke-[2]" /></div>
                      <div className="h-10 w-10 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center hover:bg-gray-50"><Activity size={18} className="stroke-[2]" /></div>
                      <div className="h-10 w-10 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center hover:bg-gray-50"><Database size={18} className="stroke-[2]" /></div>
                      
                      <div className="mt-auto h-10 w-10 rounded-xl text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center hover:bg-gray-50"><Settings size={18} className="stroke-[2]" /></div>
                   </div>

                   {/* realistic Session List */}
                   <div className="w-80 border-r border-gray-100 bg-white p-6 space-y-6 hidden lg:block shrink-0 relative z-30">
                      <div className="h-11 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-center px-4 gap-3 focus-within:bg-white focus-within:border-black/10 transition-all">
                         <Search size={14} className="text-gray-400" />
                         <div className="h-3.5 w-24 bg-gray-300 rounded-full" />
                      </div>
                      <div className="space-y-4">
                         {[
                           { name: "John Doe", msg: "Can we schedule a call?", time: "2m ago", active: true },
                           { name: "Sarah Miller", msg: "I love the new update!", time: "1h ago", active: false },
                           { name: "Alex Chen", msg: "Checking on my lead status", time: "3h ago", active: false },
                           { name: "James Wilson", msg: "When can we start?", time: "5h ago", active: false }
                         ].map((s, i) => (
                           <div key={i} className={cn("p-5 rounded-[1.5rem] flex flex-col gap-2.5 transition-all border border-transparent", s.active ? "bg-white border-gray-100 shadow-xl shadow-black/5 ring-1 ring-black/[0.02]" : "hover:bg-gray-50 group")}>
                              <div className="flex justify-between items-center text-gray-900">
                                 <span className="text-[13px] font-bold tracking-tight">{s.name}</span>
                                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-500 transition-colors">{s.time}</span>
                              </div>
                              <span className="text-[11px] text-gray-600 font-medium truncate leading-relaxed">{s.msg}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Realistic Chat Area with Secondary Parallax */}
                   <div className="flex-1 bg-white relative flex flex-col overflow-hidden">
                      <motion.div style={{ y: mockupContentY }} className="flex-1 p-12 space-y-12 relative z-10">
                         {/* User Message */}
                         <div className="flex gap-5">
                            <div className="h-11 w-11 rounded-[1.25rem] bg-gray-100 shrink-0 shadow-sm flex items-center justify-center font-bold text-gray-400 text-xs">JD</div>
                            <div className="space-y-3 max-w-sm">
                               <div className="p-6 rounded-[2rem] rounded-tl-none bg-gray-50 border border-gray-100 text-sm font-semibold leading-relaxed shadow-sm text-gray-900">
                                  How can I automate my WhatsApp customer inquiries for the spa business?
                               </div>
                               <span className="text-[9px] font-semibold text-gray-500 px-2">Customer • 10:42 AM</span>
                            </div>
                         </div>

                         {/* AI Message */}
                         <div className="flex gap-5 flex-row-reverse">
                            <div className="h-11 w-11 rounded-[1.25rem] bg-black flex items-center justify-center text-[#D95E46] shrink-0 shadow-xl ring-1 ring-white/10"><Bot size={20} className="stroke-[2.5]" /></div>
                            <div className="space-y-3 max-w-md flex flex-col items-end text-right">
                               <div className="p-7 rounded-[2rem] rounded-tr-none bg-white border border-gray-100 shadow-2xl shadow-black/5 text-[15px] font-semibold leading-relaxed ring-1 ring-black/[0.02] text-left text-gray-900">
                                  I can deploy a **Customer Support Assistant** trained specifically on your spa menu and availability. It will handle bookings via WhatsApp and sync them directly to your Google Calendar. 👋
                               </div>
                               <div className="flex items-center gap-2 px-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                  <span className="text-[10px] font-semibold text-gray-500">Assistant: Active</span>
                               </div>
                            </div>
                         </div>
                      </motion.div>

                      {/* Realistic Input Bar */}
                      <div className="h-20 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 mt-auto flex items-center px-10 justify-between relative z-[70]">
                         <span className="text-[13px] text-gray-500 font-semibold tracking-tight">Type a message or use /cmd...</span>
                         <div className="h-11 w-11 rounded-[1.25rem] bg-black flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"><Send size={16} /></div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </section>

         {/* Core Functions - Refined Contrast */}
         <motion.section style={{ y: featuresY }} className="py-56 px-6 lg:px-12 bg-[#0A0A0A] relative z-40 -mt-20">
           <div className="max-w-7xl mx-auto space-y-48">
              {/* Function 1 & 2: Agents & Knowledge */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                 <motion.div {...fadeInUp} className="space-y-10">
                    <div className="h-14 w-14 rounded-2xl bg-[#D95E46]/10 border border-[#D95E46]/20 flex items-center justify-center text-[#D95E46] shadow-2xl shadow-[#D95E46]/10"><Bot className="h-7 w-7" /></div>
                    <h2 className="text-6xl font-bold tracking-tight text-white leading-[1.05]">Deploy Automated <br/> Service Assistants</h2>
                    <p className="text-xl text-neutral-500 leading-relaxed max-w-md font-medium">Manage messages and resolve customer queries with assistants trained on your specific business logic.</p>
                    <div className="flex gap-12 border-t border-white/5 pt-10 text-gray-300">
                       <div><p className="text-3xl font-bold text-white tracking-tighter">24/7</p><p className="text-[10px] font-semibold text-neutral-500 mt-1">Availability</p></div>
                       <div><p className="text-3xl font-bold text-white tracking-tighter">98%</p><p className="text-[10px] font-semibold text-neutral-500 mt-1">Resolution</p></div>
                    </div>
                 </motion.div>
                 
                 <motion.div {...fadeInUp} className="bg-[#141414] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D95E46]/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    <div className="space-y-8 relative z-10">
                       <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-semibold text-neutral-500">Data Upload</h3>
                          <Sparkles className="h-4 w-4 text-[#D95E46] animate-pulse" />
                       </div>
                       <div className="space-y-3">
                          <div className="h-16 w-full bg-[#0A0A0A] rounded-2xl border border-white/5 flex items-center px-6 gap-5 hover:border-white/10 transition-all"><FileText className="h-5 w-5 text-[#D95E46]" /><span className="text-sm font-semibold text-white tracking-tight">Business_Playbook_2026.pdf</span><div className="ml-auto h-1.5 w-24 bg-emerald-950 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-emerald-500 shadow-[0_0_10px_#10b981]" /></div></div>
                          <div className="h-16 w-full bg-[#0A0A0A] rounded-2xl border border-white/5 flex items-center px-6 gap-5 hover:border-white/10 transition-all"><Globe className="h-5 w-5 text-neutral-600" /><span className="text-sm font-semibold text-white tracking-tight">https://docs.business.com</span><CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" /></div>
                       </div>
                    </div>
                 </motion.div>
              </div>

              {/* Function 3: Integrations - Refined Design */}
              <div className="py-40 border-t border-white/5 flex flex-col items-center text-center space-y-24">
                 <motion.div {...fadeInUp} className="max-w-2xl space-y-8">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                       <div className="h-1.5 w-1.5 rounded-full bg-[#D95E46]" />
                       <span className="text-[10px] font-semibold text-[#D95E46]">Business Interconnect</span>
                    </div>
                    <h2 className="text-6xl font-bold tracking-tight text-white leading-[1.05]">Active Connections</h2>
                    <p className="text-xl text-neutral-500 font-medium max-w-xl mx-auto">Synchronize your existing communication channels with our automated business data layer.</p>
                 </motion.div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 w-full max-w-5xl">
                    {[
                      { logo: WhatsAppLogo, label: "WhatsApp", sub: "Business Bridge" },
                      { logo: GoogleSheetsLogo, label: "Google Sheets", sub: "Data Storage" },
                      { logo: GoogleCalendarLogo, label: "Google Calendar", sub: "Schedule Sync" }
                    ].map((node, i) => (
                      <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.1 }} className="group p-10 bg-[#141414] border border-white/5 rounded-[3rem] flex flex-col items-center gap-8 hover:border-[#D95E46]/30 hover:bg-[#1A1A1A] transition-all duration-700 hover:-translate-y-2 shadow-sm">
                         <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-black/20 p-6">
                            <node.logo className="h-full w-full" />
                         </div>
                         <div className="text-center space-y-2">
                            <h4 className="text-lg font-bold text-white tracking-tight">{node.label}</h4>
                            <p className="text-[11px] font-bold text-neutral-600">{node.sub}</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              {/* Function 4 & 5: Inbox & Insights - Refined Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-40 items-center border-t border-white/5 pt-48 pb-20">
                 <motion.div {...fadeInUp} className="bg-[#141414] rounded-[4rem] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] p-12 space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart2 size={120} className="text-[#D95E46]" /></div>
                    <div className="flex items-center justify-between relative z-10">
                       <div className="space-y-1"><h4 className="text-[11px] font-semibold text-neutral-500">Real-time Volume</h4><p className="text-5xl font-bold text-white tracking-tighter">85.4%</p></div>
                       <div className="h-12 w-12 rounded-2xl bg-[#D95E46]/10 flex items-center justify-center text-[#D95E46]"><Activity size={24} /></div>
                    </div>
                    <div className="h-48 w-full bg-[#0A0A0A] rounded-3xl overflow-hidden relative z-10 border border-white/5 shadow-inner">
                       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                             <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D95E46" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#D95E46" stopOpacity="0" />
                             </linearGradient>
                          </defs>
                          <path d="M0,80 Q25,20 50,60 T100,10 L100,100 L0,100 Z" fill="url(#chart-grad)" />
                          <path d="M0,80 Q25,20 50,60 T100,10" fill="none" stroke="#D95E46" strokeWidth="4" strokeLinecap="round" />
                       </svg>
                    </div>
                 </motion.div>
                 <motion.div {...fadeInUp} className="space-y-12">
                    <div className="h-14 w-14 rounded-2xl bg-[#D95E46]/10 border border-[#D95E46]/20 flex items-center justify-center text-[#D95E46] shadow-2xl shadow-[#D95E46]/10"><Activity size={28} /></div>
                    <h2 className="text-6xl font-bold tracking-tight text-white leading-[1.05]">Full Visibility <br/> & Strategy Control</h2>
                    <p className="text-xl text-neutral-500 leading-relaxed font-medium max-w-md">Monitor assistant performance, track lead conversion, and step in manually when precision requires a human touch.</p>
                    <div className="pt-4">
                       <Button asChild className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-gray-100 font-bold text-sm transition-all active:scale-95 shadow-xl">
                          <Link href="/login">Explore Insights</Link>
                       </Button>
                    </div>
                 </motion.div>
               </div>
            </div>
         </motion.section>

         {/* FAQ Section */}
         <motion.section style={{ y: integrationsY }} className="py-56 px-6 lg:px-12 bg-[#0A0A0A] border-t border-white/5 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#D95E46]/5 blur-[160px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
           <div className="max-w-4xl mx-auto space-y-24 relative z-10 text-gray-900">
              <div className="space-y-6 text-center">
                 <h2 className="text-5xl font-bold text-white tracking-tight">Intelligence Briefing</h2>
                 <p className="text-xl text-neutral-600 font-medium">Everything you need to know about the FlowCore platform.</p>
              </div>
              <div className="grid gap-8">
                 {[
                    { q: "What is FlowCore?", a: "FlowCore is a next-generation automated orchestration platform that enables businesses to deploy specialized, high-precision assistants for customer communication and operational management." },
                    { q: "How secure is the WhatsApp Bridge?", a: "We use official WhatsApp Cloud API protocols combined with our secure automated bridge layer, ensuring all conversations are encrypted end-to-end and data isolated." },
                    { q: "Can I customize the AI's personality?", a: "Yes. Every assistant in the hub features a 'Persona' configuration where you can define their tone, instructions, and specific guardrails to match your brand voice." },
                    { q: "What integrations are supported?", a: "Currently, we feature native synchronization nodes for WhatsApp, Google Sheets, and Google Calendar, with Salesforce and custom API webhooks coming in the next release cycle." }
                 ].map((faq, i) => (
                    <motion.div key={i} {...fadeInUp} className="p-10 bg-[#141414] border border-white/5 rounded-[2.5rem] space-y-6 hover:border-white/10 transition-all cursor-default shadow-sm hover:shadow-2xl hover:shadow-black/20">
                       <h4 className="text-xl font-bold text-white tracking-tight flex items-center gap-4">
                          <div className="h-2 w-2 rounded-full bg-[#D95E46]" />
                          {faq.q}
                       </h4>
                       <p className="text-neutral-500 leading-relaxed font-medium text-lg border-l-2 border-[#D95E46]/20 pl-6 ml-1">{faq.a}</p>
                    </motion.div>
                 ))}
               </div>
            </div>
         </motion.section>
      </main>

      {/* NEW PROFESSIONAL FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-white/5 pt-40 pb-20 px-6 lg:px-12 text-gray-500">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20 mb-40 text-sm">
            <div className="lg:col-span-2 space-y-10">
               <Link href="/" className="text-3xl font-bold tracking-tighter text-white">flowcore</Link>
               <p className="max-w-xs leading-relaxed font-medium text-neutral-600 text-lg">The automated orchestration layer for automated business communication.</p>
               <div className="flex gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20 transition-all cursor-pointer shadow-lg hover:bg-white/10"><Hash className="h-5 w-5 text-neutral-400" /></div>
                  <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/20 transition-all cursor-pointer shadow-lg hover:bg-white/10"><Globe className="h-5 w-5 text-neutral-400" /></div>
               </div>
               <div className="pt-6">
                  <p className="text-[10px] text-neutral-700 font-semibold">Authorized System • Est. 2026</p>
               </div>
            </div>
            
             <div className="space-y-10 text-gray-400">
                <h4 className="text-[11px] font-semibold text-white">Platform</h4>
                <nav className="flex flex-col gap-5 font-semibold">
                   <Link href="/agent-hub" className="hover:text-white transition-colors text-neutral-500">Agent Hub</Link>
                   <Link href="/knowledge" className="hover:text-white transition-colors text-neutral-500">Knowledge Base</Link>
                   <Link href="/pricing" className="hover:text-white transition-colors text-neutral-500">Pricing</Link>
                   <Link href="/changelog" className="hover:text-white transition-colors text-neutral-500">Changelog</Link>
                </nav>
             </div>

             <div className="space-y-10 text-gray-400">
                <h4 className="text-[11px] font-semibold text-white">Connect</h4>
                <nav className="flex flex-col gap-5 font-semibold">
                   <Link href="/login" className="hover:text-white transition-colors text-neutral-500">Sign In</Link>
                   <Link href="/faq" className="hover:text-white transition-colors text-neutral-500">FAQ</Link>
                   <Link href="/settings/integrations" className="hover:text-white transition-colors text-neutral-500">Integrations</Link>
                   <Link href="/legal" className="hover:text-white transition-colors text-neutral-500">Legal</Link>
                </nav>
             </div>

             <div className="space-y-10 text-gray-400">
                <h4 className="text-[11px] font-semibold text-white">Company</h4>
                <nav className="flex flex-col gap-5 font-semibold">
                   <Link href="/login" className="hover:text-white transition-colors text-neutral-500">Get Started</Link>
                   <Link href="/pricing" className="hover:text-white transition-colors text-neutral-500">Subscription Plans</Link>
                   <Link href="/faq" className="hover:text-white transition-colors text-neutral-500">Case Studies</Link>
                   <Link href="/changelog" className="hover:text-white transition-colors text-neutral-500">Network Status</Link>
                </nav>
             </div>
         </div>

         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-16 gap-10 text-xs font-semibold text-neutral-600">
             <nav className="flex gap-10">
                <Link href="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/legal/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
             </nav>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-4 text-emerald-500/60 font-semibold tracking-tight">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  Verified Connection
               </div>
               <span className="tracking-tight text-neutral-700 font-medium">© 2026 FlowCore Systems</span>
            </div>
         </div>
      </footer>
    </div>
  )
}
