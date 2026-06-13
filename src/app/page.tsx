"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpRight,
  Send,
  Inbox,
  BarChart2,
  Globe
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

const sf = { fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }

const sectionAnim = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-120px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }
}

const slideLeft = {
  initial: { opacity: 0, x: -40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }
}

const slideRight = {
  initial: { opacity: 0, x: 40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }
}

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const router = useRouter()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, 180])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.3])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.3])
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4])

  return (
    <div className="min-h-screen scroll-smooth" style={sf}>
      <header className="h-14 flex items-center justify-between px-6 lg:px-12 fixed top-0 left-0 right-0 z-[100]" style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.7) 100%)", backdropFilter: "blur(12px)" }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(198,95,57,0.4) 20%, rgba(198,95,57,0.6) 50%, rgba(198,95,57,0.4) 80%, transparent 100%)" }} />
        <div className="absolute inset-0 rounded-b-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(198,95,57,0.08) 0%, transparent 70%)" }} />
        <div className="flex items-center gap-2 relative z-10">
          <Link href="/" className="text-base font-medium tracking-tight" style={{ color: "#e5e5e5", letterSpacing: "-0.01em" }}>
            FlowCore
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 relative z-10">
          <Link href="/pricing" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Pricing</Link>
          <Link href="/faq" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>FAQ</Link>
          <Link href="/changelog" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Changelog</Link>
        </nav>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/login" className="hidden sm:inline text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Sign In</Link>
          <Button asChild className="h-8 px-4 rounded-[100px] text-sm font-normal flex items-center gap-1" style={{ background: "#c65f39", color: "#fff" }}>
            <Link href="/login">Book Demo <ArrowUpRight className="h-3 w-3" /></Link>
          </Button>
        </div>
      </header>

      <main ref={heroRef}>
        <section className="relative min-h-screen pt-32 pb-48 px-6 overflow-hidden flex flex-col items-center" style={{ background: "linear-gradient(180deg, #0d0705 0%, #080505 30%, #050505 60%)" }}>
          <motion.div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full pointer-events-none z-0" style={{ scale: glowScale, opacity: glowOpacity, background: "radial-gradient(ellipse at center, rgba(198, 95, 57, 0.35) 0%, rgba(198, 95, 57, 0.12) 30%, rgba(198, 95, 57, 0.04) 60%, transparent 80%)" }} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1400px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at center, rgba(198, 95, 57, 0.06) 0%, transparent 60%)" }} />

          <motion.div className="max-w-[1040px] mx-auto text-center relative z-10 space-y-12" style={{ opacity: heroOpacity, scale: heroScale }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
              className="space-y-5"
            >
              <h1 className="font-normal leading-[1.05] tracking-tighter text-white" style={{ fontSize: "84px", lineHeight: "88px", letterSpacing: "-0.03em" }}>
                Automated customer<br/>
                service <span style={{ color: "#c65f39" }}>assistants</span>
              </h1>
              <p className="max-w-2xl mx-auto leading-relaxed font-normal" style={{ fontSize: "18px", color: "#888" }}>
                Connect specialized AI to manage and resolve your customer conversations with business precision.
              </p>

              {/* Smol Launch Badge */}
              <div className="flex justify-center pt-4">
                <a href="https://smollaunch.com" target="_blank" rel="noopener">
                  <img src="https://smollaunch.com/badges/featured-dark.svg" alt="Flowcore AI — Featured on Smol Launch" loading="lazy" width="250" height="60" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              className="max-w-sm mx-auto"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  router.push(`/login?email=${encodeURIComponent(email)}`)
                }}
                className="flex p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent border-none h-11 px-4 focus-visible:ring-0 text-sm font-normal" style={{ color: "#fff" }}
                />
                <Button type="submit" className="h-11 px-5 rounded-lg text-sm font-normal flex items-center gap-1" style={{ background: "#c65f39", color: "#fff" }}>
                  Get Started <ArrowUpRight className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          </motion.div>

          <motion.div className="w-full max-w-[980px] px-6 relative z-30 mt-32" style={{ y: dashboardY }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
              <div className="flex items-center justify-between h-10 px-5" style={{ borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                  <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                  <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-md" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                  <div className="h-1 w-1 rounded-full" style={{ background: "#c65f39" }} />
                  <span className="text-[9px] font-normal" style={{ color: "#737373" }}>app.flowcore.ai</span>
                </div>
                <div className="h-4 w-4 rounded flex items-center justify-center text-[7px] font-semibold" style={{ background: "#f5f5f5", color: "#a3a3a3", border: "1px solid #e5e5e5" }}>F</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 h-[350px]">
                <div className="p-4 space-y-4 hidden md:block" style={{ borderRight: "1px solid #e5e5e5", background: "#fcfcfc" }}>
                  <div className="font-normal flex items-center gap-2" style={{ color: "#171717", fontSize: "13.7086px" }}><Inbox className="h-4 w-4" style={{ color: "#c65f39" }} /> Inbox</div>
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                      <div className="flex justify-between" style={{ color: "#171717", fontSize: "11px" }}>Will Garman <span style={{ color: "#c65f39", fontSize: "9px" }}>Active</span></div>
                      <div style={{ fontSize: "10px", color: "#737373" }}>I was wondering if I can extend...</div>
                    </div>
                    <div className="p-2 rounded-lg opacity-40">
                      <div style={{ color: "#171717", fontSize: "11px" }}>Jane Doe</div>
                      <div style={{ fontSize: "10px", color: "#a3a3a3" }}>Book a double room for next Friday</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 p-4 flex flex-col justify-between h-full" style={{ background: "#ffffff" }}>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(198, 95, 57, 0.15)", color: "#c65f39" }}>WG</div>
                      <div className="p-2.5 rounded-2xl max-w-[80%]" style={{ background: "#fafafa", border: "1px solid #e5e5e5", color: "#525252", fontSize: "13px" }}>
                        I was wondering if I can extend my upcoming stay to checkout one day later??
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="p-2.5 rounded-2xl max-w-[80%]" style={{ background: "rgba(198, 95, 57, 0.06)", border: "1px solid rgba(198, 95, 57, 0.15)", color: "#525252", fontSize: "13px" }}>
                        <span className="block mb-0.5" style={{ color: "#c65f39", fontSize: "9px" }}>Support Agent</span>
                        Let me query availability for property 230CALST. One moment.
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-xl flex gap-2 items-center" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
                    <input type="text" placeholder="Type a message..." className="bg-transparent flex-1 border-none focus:outline-none px-2" style={{ color: "#a3a3a3", fontSize: "11px" }} disabled />
                    <button className="p-1 rounded-lg" style={{ background: "#c65f39", color: "#fff" }}><Send className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-4 hidden md:block" style={{ background: "#fcfcfc" }}>
                  <div className="font-normal flex items-center gap-2" style={{ color: "#171717", fontSize: "13.7086px" }}><BarChart2 className="h-4 w-4" style={{ color: "#c65f39" }} /> Analytics</div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                      <div style={{ color: "#737373", fontSize: "10px" }}>AI Automation Rate</div>
                      <div className="mt-0.5" style={{ color: "#171717", fontSize: "24px", fontWeight: 300, letterSpacing: "-0.01em" }}>70.6%</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section {...sectionAnim} className="py-16 px-6 flex flex-col items-center" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="text-sm font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.05em" }}>
            Used by teams worldwide
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 max-w-4xl px-6 mt-8" style={{ opacity: 0.5 }}>
            {["Haus", "Hallson", "Capitalia", "HostGenius", "Renjoy", "Bocobay", "Casioa", "MerchFarm"].map((brand, i) => (
              <motion.span key={i} custom={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} className="text-base tracking-tight select-none cursor-default" style={{ color: "#171717", fontWeight: 400 }}>
                {brand}
              </motion.span>
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff" }}>
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-sm font-normal mb-4" style={{ color: "#c65f39" }}>Platform</p>
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Handle communication end-to-end
            </h2>
            <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
              FlowCore keeps your team focused by intelligently handling communications and escalating only the critical moments.
            </p>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff" }}>
          <div className="max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...slideLeft} className="space-y-6">
              <p className="text-sm font-normal" style={{ color: "#c65f39" }}>Reporting</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                See ROI in 30 days
              </h2>
              <p className="leading-relaxed max-w-md font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                AI insights to help monitor, evaluate, and continuously optimize your conversations.
              </p>
              <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1" style={{ background: "#c65f39", color: "#fff" }}>
                <Link href="/login">Book Demo <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>

            <motion.div {...slideRight} className="p-6 rounded-2xl overflow-hidden" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <div className="flex items-center gap-2" style={{ fontSize: "13px", color: "#525252" }}>
                    <span>Last 7 days</span>
                    <span style={{ color: "#a3a3a3" }}>compared to</span>
                    <span className="px-2 py-0.5 rounded" style={{ background: "#f5f5f5", border: "1px solid #e5e5e5", color: "#a3a3a3" }}>Previous period</span>
                  </div>
                  <div style={{ color: "#a3a3a3", fontSize: "10px" }}>Aug 22, 2025 - Aug 29, 2025</div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div style={{ color: "#a3a3a3", fontSize: "10px", letterSpacing: "0.05em" }}>AI automation rate</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="tracking-tight" style={{ color: "#171717", fontSize: "32px", fontWeight: 300 }}>70.6%</span>
                      <span className="px-1.5 py-0.5 rounded" style={{ background: "#f5f5f5", color: "#a3a3a3", fontSize: "10px" }}>-8.1%</span>
                    </div>
                    <div style={{ color: "#a3a3a3", fontSize: "9px", marginTop: "4px" }}>78.7% previous period</div>
                  </div>
                  <div>
                    <div style={{ color: "#a3a3a3", fontSize: "10px", letterSpacing: "0.05em" }}>Open ticket count</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="tracking-tight" style={{ color: "#171717", fontSize: "32px", fontWeight: 300 }}>133</span>
                    </div>
                    <div style={{ color: "#a3a3a3", fontSize: "9px", marginTop: "4px" }}>90 previous period</div>
                  </div>
                </div>

                <div className="h-32 w-full rounded-xl overflow-hidden relative" style={{ background: "#f5f5f5", border: "1px solid #e5e5e5" }}>
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chart-grad-light" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c65f39" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#c65f39" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10 L100,100 L0,100 Z" fill="url(#chart-grad-light)" />
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10" fill="none" stroke="#c65f39" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="space-y-3 pt-2">
                  <div style={{ color: "#a3a3a3", fontSize: "10px", letterSpacing: "0.05em" }}>Escalations</div>
                  <div className="space-y-2" style={{ fontSize: "13px" }}>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: "#525252" }}><span>AI missing info</span><span style={{ color: "#171717" }}>19 <span style={{ color: "#a3a3a3", fontWeight: 400 }}>(52.8%)</span></span></div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e5e5e5" }}><div className="h-full w-[52.8%] rounded-full" style={{ background: "#c65f39" }} /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: "#525252" }}><span>AI needs your help</span><span style={{ color: "#171717" }}>10 <span style={{ color: "#a3a3a3", fontWeight: 400 }}>(27.8%)</span></span></div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e5e5e5" }}><div className="h-full w-[27.8%] rounded-full" style={{ background: "#f59e0b" }} /></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: "#525252" }}><span>Urgent tagged</span><span style={{ color: "#171717" }}>7 <span style={{ color: "#a3a3a3", fontWeight: 400 }}>(19.4%)</span></span></div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e5e5e5" }}><div className="h-full w-[19.4%] rounded-full" style={{ background: "#e11d48" }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff" }}>
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-sm font-normal mb-4" style={{ color: "#c65f39" }}>Unified Inbox</p>
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Everything in one place
            </h2>
            <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
              When automation ends, your control begins — streamline every conversation your AI can't handle in one place.
            </p>
            <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1 mt-6" style={{ background: "#c65f39", color: "#fff" }}>
              <Link href="/login">Book Demo <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12 text-center" style={{ background: "#ffffff" }}>
          <div className="max-w-[820px] mx-auto space-y-12">
            <div className="space-y-6">
              <p className="text-sm font-normal" style={{ color: "#c65f39" }}>Integrations</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                Integrate with every aspect of your tech stack
              </h2>
              <p className="max-w-lg mx-auto leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                Give agents the tools to succeed, backed by enterprise-grade security and SOC 2 Type II compliance.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
              {[
                { logo: WhatsAppLogo, label: "WhatsApp" },
                { logo: GoogleSheetsLogo, label: "Google Sheets" },
                { logo: GoogleCalendarLogo, label: "Google Calendar" },
                { logo: () => <Globe className="h-full w-full" style={{ color: "#a3a3a3" }} />, label: "Webchat" }
              ].map((node, i) => (
                <motion.div key={i} {...scaleIn} transition={{ duration: 0.9, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const }} className="p-6 rounded-xl flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center p-2.5" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                    <node.logo className="h-full w-full" />
                  </div>
                  <div>
                    <h4 className="text-sm font-normal" style={{ color: "#525252" }}>{node.label}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12 relative overflow-hidden" style={{ background: "#050505" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full translate-x-1/3 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(198, 95, 57, 0.1) 0%, transparent 60%)" }}
          />
          <div className="max-w-[1060px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...slideLeft} className="space-y-6">
              <p className="text-sm font-normal" style={{ color: "#c65f39" }}>Enterprise</p>
              <h2 className="font-normal tracking-tight text-white" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px" }}>
                Built for Enterprise Security and Privacy
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1" style={{ background: "#c65f39", color: "#fff" }}>
                  <Link href="/login">Talk to Sales <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </motion.div>

            <motion.div {...slideRight} className="grid grid-cols-1 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                className="p-5 rounded-2xl space-y-3"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h3 className="text-base font-normal" style={{ color: "#fff" }}>SOC Type II</h3>
                <p className="text-sm leading-relaxed font-normal" style={{ color: "#595859" }}>
                  FlowCore meets SOC 2 Type II standards for secure handling of customer data across all AI-powered operations.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                className="p-5 rounded-2xl space-y-3"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h3 className="text-base font-normal" style={{ color: "#fff" }}>HIPAA & Enterprise Security</h3>
                <p className="text-sm leading-relaxed font-normal" style={{ color: "#595859" }}>
                  End-to-end encryption, role-based access, audit logs, and secure model orchestration across all AI agents.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[820px] mx-auto text-center flex flex-col items-center">
            <p className="text-sm font-normal mb-4" style={{ color: "#c65f39" }}>Community</p>
            <h2 className="font-normal tracking-tight mb-8" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Featured on Smol Launch
            </h2>
            <a
              href="https://smollaunch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full max-w-[500px] text-left"
              style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}
            >
              <img
                src="https://smollaunch.com/badges/featured-dark.svg"
                alt="Flowcore AI — Featured on Smol Launch"
                loading="lazy"
                width="250"
                height="60"
                className="shrink-0"
              />
            </a>
          </div>
        </motion.section>

      </main>

      <footer className="pt-20 pb-12 px-8 lg:px-16" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-5">
              <Link href="/" className="text-lg font-medium tracking-tight" style={{ color: "#171717", letterSpacing: "-0.01em" }}>
                FlowCore
              </Link>
              <p className="text-sm leading-relaxed font-normal max-w-[200px]" style={{ color: "#737373" }}>
                AI agents for customer communication.
              </p>
              <p className="text-sm font-normal" style={{ color: "#737373" }}>
                support@flowcore.ai
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#a3a3a3" }}>Product</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/login" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Features</Link>
                <Link href="/pricing" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Pricing</Link>
                <Link href="/changelog" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Changelog</Link>
                <Link href="/faq" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>FAQ</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#a3a3a3" }}>Company</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/legal/privacy-policy" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Privacy Policy</Link>
                <Link href="/legal/terms" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Terms</Link>
                <Link href="/legal/cookie-policy" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Cookies</Link>
                <Link href="/legal" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Legal</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#a3a3a3" }}>Compliance</h4>
              <nav className="flex flex-col gap-3">
                <span className="text-sm font-normal" style={{ color: "#525252" }}>SOC 2 Type II</span>
                <span className="text-sm font-normal" style={{ color: "#525252" }}>HIPAA Compliant</span>
              </nav>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-6" style={{ borderTop: "1px solid #e5e5e5" }}>
            <span className="text-sm font-normal" style={{ color: "#a3a3a3" }}>&copy; 2026 FlowCore Systems. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
