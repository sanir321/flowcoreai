"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
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

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 12, y: y * -12 })
  }, [])
  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transformPerspective: 800 }}
      animate={{ rotateX: tilt.y, rotateY: tilt.x }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

function FloatingParticles({ count = 12 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: "rgba(198, 95, 57, 0.4)",
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}

export function LandingPage() {
  const [email, setEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        <motion.div className="flex items-center gap-2 relative z-10"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/" className="text-base font-medium tracking-tight" style={{ color: "#e5e5e5", letterSpacing: "-0.01em" }}>
            Flowter
          </Link>
        </motion.div>

        <nav className="hidden md:flex items-center gap-1 relative z-10">
          {([["Features", "/features"], ["Pricing", "/pricing"], ["FAQ", "/faq"], ["Changelog", "/changelog"]] as const).map(([label, href], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={href} className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>{label}</Link>
            </motion.div>
          ))}
        </nav>

        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg relative z-10"
          style={{ color: "#a3a3a3" }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        <motion.div className="flex items-center gap-3 relative z-10"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/login" className="hidden sm:inline text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Sign In</Link>
          <Button asChild className="h-8 px-4 rounded-[100px] text-sm font-normal flex items-center gap-1 group" style={{ background: "#f9510b", color: "#fff" }}>
            <Link href="/login">Get Started <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
          </Button>
        </motion.div>
      </header>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-14 left-0 right-0 z-[99] md:hidden"
          style={{ background: "rgba(5,5,5,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(198,95,57,0.2)" }}
        >
          <nav className="flex flex-col px-6 py-4 gap-1">
            {([["Features", "/features"], ["Pricing", "/pricing"], ["FAQ", "/faq"], ["Changelog", "/changelog"]] as const).map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="px-4 py-3 text-sm font-normal rounded-lg transition-colors"
                style={{ color: "#a3a3a3" }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e5e5"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#a3a3a3"; e.currentTarget.style.background = "transparent" }}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Link
                href="/login"
                className="block px-4 py-3 text-sm font-normal rounded-lg transition-colors"
                style={{ color: "#a3a3a3" }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e5e5"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#a3a3a3"; e.currentTarget.style.background = "transparent" }}
              >
                Sign In
              </Link>
            </div>
          </nav>
        </motion.div>
      )}

      <main ref={heroRef}>
        <section
          className="relative min-h-screen pt-32 pb-48 px-6 overflow-hidden flex flex-col items-center"
          style={{ background: "linear-gradient(180deg, #0d0705 0%, #080505 30%, #050505 60%)" }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            e.currentTarget.style.setProperty("--mx", `${x}%`)
            e.currentTarget.style.setProperty("--my", `${y}%`)
          }}
        >
          <FloatingParticles count={15} />
          <motion.div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full pointer-events-none z-0" style={{ scale: glowScale, opacity: glowOpacity, background: "radial-gradient(ellipse at center, rgba(198, 95, 57, 0.35) 0%, rgba(198, 95, 57, 0.12) 30%, rgba(198, 95, 57, 0.04) 60%, transparent 80%)" }} />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1400px] h-[500px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at center, rgba(198, 95, 57, 0.06) 0%, transparent 60%)" }} />
          <motion.div className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500" style={{ background: "radial-gradient(800px circle at var(--mx, 50%) var(--my, 50%), rgba(198, 95, 57, 0.08) 0%, transparent 60%)" }} />

          <motion.div className="max-w-[1040px] mx-auto text-center relative z-10 space-y-12" style={{ opacity: heroOpacity, scale: heroScale }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
              className="space-y-5"
            >

              <h1 className="font-normal leading-[1.05] tracking-tighter text-white" style={{ fontSize: "84px", lineHeight: "88px", letterSpacing: "-0.03em" }}>
                Stop answering the<br/>
                same question <span style={{ color: "#f9510b" }}>30 times a day</span>
              </h1>
              <p className="max-w-2xl mx-auto leading-relaxed font-normal" style={{ fontSize: "18px", color: "#888" }}>
                Your customers get instant answers on WhatsApp, 24/7. AI handles the repetitive questions and bookings, and hands off to you only when it matters.
              </p>
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
                className="flex p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 0 0 1px rgba(198,95,57,0.08), 0 8px 24px rgba(0,0,0,0.35)" }}
              >
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent border-none h-11 px-4 focus-visible:ring-0 text-sm font-normal" style={{ color: "#fff" }}
                />
                <Button type="submit" className="h-11 px-5 rounded-lg text-sm font-normal flex items-center gap-1 group" style={{ background: "#f9510b", color: "#fff" }}>
                  Get Started <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </form>
              <p className="text-center mt-3 text-xs font-normal" style={{ color: "#737373" }}>
                Free to start — no credit card required.
              </p>
            </motion.div>
          </motion.div>

          <motion.div className="w-full max-w-[1000px] px-6 relative z-30 mt-32" style={{ y: dashboardY }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
              <div className="flex items-center gap-2 h-10 px-5" style={{ borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
                <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                <div className="h-2 w-2 rounded-full" style={{ background: "#d4d4d4" }} />
                <div className="flex items-center gap-2 px-3 py-1 rounded-md mx-auto" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                  <div className="h-1 w-1 rounded-full" style={{ background: "#f9510b" }} />
                  <span className="text-[10px] font-normal" style={{ color: "#737373" }}>app.Flowter.ai/analytics</span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/producthunt/analytics-clean.png"
                alt="Flowter analytics dashboard showing messages, contacts, automation rate, and integration status"
                width={1270}
                height={588}
                className="w-full h-auto block"
              />
            </motion.div>
          </motion.div>
        </section>

        <motion.section {...sectionAnim} className="py-16 px-6" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[1060px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "70%+", label: "AI Automation" },
                { value: "<10 Min", label: "Setup" },
                { value: "24/7", label: "Coverage" },
                { value: "3", label: "AI Agents" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="text-3xl md:text-4xl font-normal tracking-tight" style={{ color: "#171717" }}>{stat.value}</div>
                  <div className="text-sm font-normal mt-1" style={{ color: "#a3a3a3" }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-20 px-6" style={{ background: "#fafafa", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[1060px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.05em" }}>
                Trusted by growing businesses
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Priya Sharma", role: "Founder", company: "Tasty Bistro", text: "We went from missing 40% of WhatsApp messages to responding instantly. Our customers love the speed, and our team finally has time to focus on what matters." },
                { name: "Arjun Mehta", role: "Operations Lead", company: "Webuild LLP", text: "Setup took less than 10 minutes. The AI handles appointment scheduling and FAQs flawlessly — it&apos;s like having an extra team member who never sleeps." },
                { name: "Sneha Kulkarni", role: "Customer Success", company: "FreshCart", text: "The unified inbox changed everything. We can see all conversations across WhatsApp and webchat in one place. Response time dropped from hours to seconds." },
              ].map((testimonial, i) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-2xl"
                  style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}
                >
                  <p className="text-sm leading-relaxed font-normal mb-6" style={{ color: "#525252" }}>&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-normal" style={{ background: "rgba(198, 95, 57, 0.08)", color: "#f9510b" }}>
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-normal" style={{ color: "#171717" }}>{testimonial.name}</div>
                      <div className="text-xs font-normal" style={{ color: "#a3a3a3" }}>{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff" }}>
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>Platform</p>
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Handle communication end-to-end
            </h2>
            <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
              Flowter keeps your team focused by intelligently handling communications and escalating only the critical moments.
            </p>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#fafafa", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>How It Works</p>
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Three steps to automate support
            </h2>
          </div>
          <div className="max-w-[1060px] mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect WhatsApp",
                description: "Scan a QR code, done in seconds. Same method as WhatsApp Web — no Meta approval or developer setup needed.",
              },
              {
                step: "02",
                title: "Train your AI",
                description: "Upload docs, FAQs, policies — your AI learns your business. The more you give it, the smarter it gets.",
              },
              {
                step: "03",
                title: "Go Live",
                description: "AI handles conversations 24/7, escalates when needed. You stay in control while your team focuses on what matters.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-center p-8 rounded-2xl"
                style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}
              >
                <div className="text-3xl font-normal mb-4" style={{ color: "#f9510b" }}>{item.step}</div>
                <h3 className="text-base font-normal mb-2" style={{ color: "#171717" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed font-normal" style={{ color: "#737373" }}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff" }}>
          <div className="max-w-[1060px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...slideLeft} className="space-y-6">
              <p className="text-sm font-normal" style={{ color: "#f9510b" }}>Reporting</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                See ROI in 30 days
              </h2>
              <p className="leading-relaxed max-w-md font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                AI insights to help monitor, evaluate, and continuously optimize your conversations.
              </p>
              <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1" style={{ background: "#f9510b", color: "#fff" }}>
                <Link href="/login">Get Started <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
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
                        <stop offset="0%" stopColor="#f9510b" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#f9510b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10 L100,100 L0,100 Z" fill="url(#chart-grad-light)" />
                    <path d="M0,80 C20,70 40,30 60,50 C80,70 90,20 100,10" fill="none" stroke="#f9510b" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="space-y-3 pt-2">
                  <div style={{ color: "#a3a3a3", fontSize: "10px", letterSpacing: "0.05em" }}>Escalations</div>
                  <div className="space-y-2" style={{ fontSize: "13px" }}>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: "#525252" }}><span>AI missing info</span><span style={{ color: "#171717" }}>19 <span style={{ color: "#a3a3a3", fontWeight: 400 }}>(52.8%)</span></span></div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e5e5e5" }}><div className="h-full w-[52.8%] rounded-full" style={{ background: "#f9510b" }} /></div>
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
            <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>Unified Inbox</p>
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              Everything in one place
            </h2>
            <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
              When automation ends, your control begins — streamline every conversation your AI can&apos;t handle in one place.
            </p>
            <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1 mt-6 group" style={{ background: "#f9510b", color: "#fff" }}>
              <Link href="/login">Get Started <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
            </Button>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12 text-center" style={{ background: "#ffffff" }}>
          <div className="max-w-[820px] mx-auto space-y-12">
            <div className="space-y-6">
              <p className="text-sm font-normal" style={{ color: "#f9510b" }}>Integrations</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                Integrate with every aspect of your tech stack
              </h2>
              <p className="max-w-lg mx-auto leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                Connect WhatsApp by scanning a QR code — the same method as WhatsApp Web. No Meta approval, WABA number, or developer setup required.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
              {[
                { logo: WhatsAppLogo, label: "WhatsApp" },
                { logo: GoogleSheetsLogo, label: "Google Sheets" },
                { logo: GoogleCalendarLogo, label: "Google Calendar" },
                { logo: () => <Globe className="h-full w-full" style={{ color: "#a3a3a3" }} />, label: "Webchat" }
              ].map((node, i) => (
                <TiltCard key={i}>
                <motion.div {...scaleIn} transition={{ duration: 0.9, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const }} className="p-6 rounded-xl flex flex-col items-center gap-4 transition-all duration-300 hover:scale-105" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center p-2.5" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                    <node.logo className="h-full w-full" />
                  </div>
                  <div>
                    <h4 className="text-sm font-normal" style={{ color: "#525252" }}>{node.label}</h4>
                  </div>
                </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[1060px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>Features</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                Everything you need to automate support
              </h2>
              <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                Three specialized AI agents, multiple channels, one unified platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Booking Agent",
                  description: "Handles appointment scheduling end-to-end — checks availability, books slots, sends confirmations, and manages rescheduling without human intervention.",
                  icon: <Globe className="h-5 w-5" style={{ color: "#f9510b" }} />,
                },
                {
                  title: "Sales Agent",
                  description: "Responds to product inquiries instantly, searches your catalog, generates quotes, and guides customers through purchase decisions — all conversationally.",
                  icon: <BarChart2 className="h-5 w-5" style={{ color: "#f9510b" }} />,
                },
                {
                  title: "Support Agent",
                  description: "Answers questions from your knowledge base, handles complaints, explains policies, and seamlessly escalates complex issues to your team when needed.",
                  icon: <Inbox className="h-5 w-5" style={{ color: "#f9510b" }} />,
                },
              ].map((feature, i) => (
                <TiltCard key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
                  className="p-6 rounded-2xl group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(198, 95, 57, 0.08)" }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-normal mb-2" style={{ color: "#171717" }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed font-normal" style={{ color: "#737373" }}>{feature.description}</p>
                </motion.div>
                </TiltCard>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1 mx-auto group" style={{ background: "#f9510b", color: "#fff" }}>
                <Link href="/features">See All Features <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
              </Button>
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[1060px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>Pricing</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                Simple, transparent pricing
              </h2>
              <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                Start free, scale as you grow. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  tier: "Starter",
                  price: "Free",
                  period: "",
                  description: "Perfect for trying out Flowter",
                  features: ["100 conversations/mo", "1 AI agent", "Webchat widget", "Basic analytics"],
                  cta: "Get Started",
                  highlighted: false,
                },
                {
                  tier: "Growth",
                  price: "$29",
                  period: "/mo",
                  description: "For growing businesses",
                  features: ["1,000 conversations/mo", "3 AI agents", "WhatsApp + Webchat", "Priority support", "Advanced analytics"],
                  cta: "Start Free Trial",
                  highlighted: true,
                },
                {
                  tier: "Enterprise",
                  price: "Custom",
                  period: "",
                  description: "For large-scale operations",
                  features: ["Unlimited conversations", "Custom AI training", "SLA guarantee", "Dedicated support", "Custom integrations"],
                  cta: "Talk to Sales",
                  highlighted: false,
                },
              ].map((plan, i) => (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="p-6 rounded-2xl flex flex-col"
                  style={{
                    background: plan.highlighted ? "#171717" : "#fafafa",
                    border: plan.highlighted ? "1px solid #333" : "1px solid #e5e5e5",
                  }}
                >
                  <div className="mb-6">
                    <p className="text-sm font-normal mb-2" style={{ color: plan.highlighted ? "#f9510b" : "#a3a3a3" }}>{plan.tier}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-normal tracking-tight" style={{ color: plan.highlighted ? "#ffffff" : "#171717" }}>{plan.price}</span>
                      {plan.period && <span className="text-sm font-normal" style={{ color: plan.highlighted ? "#595859" : "#a3a3a3" }}>{plan.period}</span>}
                    </div>
                    <p className="text-sm font-normal mt-2" style={{ color: plan.highlighted ? "#595859" : "#737373" }}>{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm font-normal" style={{ color: plan.highlighted ? "#d4d4d4" : "#525252" }}>
                        <svg className="h-4 w-4 flex-shrink-0" style={{ color: "#f9510b" }} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1 justify-center w-full group" style={{ background: plan.highlighted ? "#f9510b" : "#ffffff", color: plan.highlighted ? "#fff" : "#171717", border: plan.highlighted ? "none" : "1px solid #e5e5e5" }}>
                    <Link href={plan.tier === "Enterprise" ? "/pricing" : "/login"}>{plan.cta} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[1060px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-normal mb-4" style={{ color: "#f9510b" }}>What We Believe</p>
              <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
                AI should assist, not replace
              </h2>
              <p className="max-w-lg mx-auto mt-4 leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#737373" }}>
                The principles behind how we build — and how we treat your data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "AI should assist, not replace", text: "The best customer service combines AI speed with human empathy. Our platform is built for collaboration, not replacement." },
                { title: "Simplicity wins", text: "No complex setups, no API approvals, no developer required. Connect WhatsApp with a QR code. Deploy AI in minutes." },
                { title: "Your data, your control", text: "We don't train on your data. We don't sell your data. You own everything, and you can export or delete it anytime." },
                { title: "Transparency matters", text: "Clear pricing. No hidden fees. Open about what our AI can and can't do. Honest about limitations." },
              ].map((belief, i) => (
                <TiltCard key={belief.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const }}
                  className="p-6 rounded-2xl"
                  style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}
                >
                  <h3 className="text-base font-normal mb-2" style={{ color: "#171717" }}>{belief.title}</h3>
                  <p className="text-sm leading-relaxed font-normal" style={{ color: "#737373" }}>{belief.text}</p>
                </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionAnim} className="py-24 px-6 lg:px-12" style={{ background: "#ffffff", borderTop: "1px solid #e5e5e5" }}>
          <div className="max-w-[820px] mx-auto text-center space-y-8">
            <h2 className="font-normal tracking-tight" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px", color: "#171717" }}>
              What is Flowter?
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#525252", lineHeight: 1.8 }}>
              Flowter is an AI-powered customer support platform that helps businesses respond to customers instantly — on WhatsApp, webchat, and more. Instead of hiring more staff or letting messages pile up, Flowter&apos;s AI agents handle the repetitive questions, book appointments, and answer FAQs around the clock.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#525252", lineHeight: 1.8 }}>
              Getting started takes minutes, not months. Scan a QR code to connect WhatsApp, upload your business docs to train your AI, and you&apos;re live. When the AI can&apos;t handle something, it seamlessly hands off to your team — so nothing falls through the cracks.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#525252", lineHeight: 1.8 }}>
              Flowter gives you a unified inbox for all conversations, real-time analytics to track performance, and the flexibility to scale from 100 to 100,000 conversations. It&apos;s customer support that works while you sleep.
            </p>
          </div>
        </motion.section>

        <section className="py-20 px-6" style={{ background: "#050505" }}>
          <div className="max-w-[820px] mx-auto text-center space-y-6">
            <h2 className="font-normal tracking-tight text-white" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px" }}>
              Start automating customer support today
            </h2>
            <p className="text-base font-normal" style={{ color: "#a3a3a3" }}>
              Free to start. No credit card required.
            </p>
            <Button asChild className="h-12 px-8 rounded-[100px] text-sm font-normal flex items-center gap-1 mx-auto group" style={{ background: "#f9510b", color: "#fff" }}>
              <Link href="/login">Get Started Free <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
            </Button>
          </div>
        </section>

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
              <p className="text-sm font-normal" style={{ color: "#f9510b" }}>Enterprise</p>
              <h2 className="font-normal tracking-tight text-white" style={{ fontSize: "35.2508px", lineHeight: "44.0635px", letterSpacing: "-0.15667px" }}>
                Built for Enterprise Security and Privacy
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="h-11 px-5 rounded-[100px] text-sm font-normal flex items-center gap-1 group" style={{ background: "#f9510b", color: "#fff" }}>
                  <Link href="/pricing">Talk to Sales <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
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
                <h3 className="text-base font-normal" style={{ color: "#fff" }}>SOC 2 — in progress</h3>
                <p className="text-sm leading-relaxed font-normal" style={{ color: "#595859" }}>
                  We&apos;re working toward SOC 2 Type II certification. Customer data is handled with secure, audited practices across all AI-powered operations.
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
                <h3 className="text-base font-normal" style={{ color: "#fff" }}>Enterprise-grade security</h3>
                <p className="text-sm leading-relaxed font-normal" style={{ color: "#595859" }}>
                  End-to-end encryption, role-based access, audit logs, tenant isolation, and secure model orchestration across all AI agents.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

      </main>

      <footer className="pt-20 pb-12 px-8 lg:px-16" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-5">
              <Link href="/" className="text-lg font-medium tracking-tight" style={{ color: "#171717", letterSpacing: "-0.01em" }}>
                Flowter
              </Link>
              <p className="text-sm leading-relaxed font-normal max-w-[200px]" style={{ color: "#737373" }}>
                AI agents for customer communication.
              </p>
              <p className="text-sm font-normal" style={{ color: "#737373" }}>
                support@Flowter.ai
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#a3a3a3" }}>Product</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/features" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Features</Link>
                <Link href="/pricing" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Pricing</Link>
                <Link href="/blog" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Blog</Link>
                <Link href="/case-studies" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Case Studies</Link>
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
                <Link href="/legal/refund-policy" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Refund Policy</Link>
                <Link href="/legal/dpa" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>DPA</Link>
                <Link href="/legal/aup" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>AUP</Link>
                <Link href="/legal/data-deletion" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Data Deletion</Link>
                <Link href="/legal" className="text-sm font-normal transition-colors" style={{ color: "#525252" }}>Legal</Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#a3a3a3" }}>Compliance</h4>
              <nav className="flex flex-col gap-3">
                <span className="text-sm font-normal" style={{ color: "#525252" }}>SOC 2 — in progress</span>
                <span className="text-sm font-normal" style={{ color: "#525252" }}>GDPR-ready</span>
              </nav>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-6" style={{ borderTop: "1px solid #e5e5e5" }}>
            <span className="text-sm font-normal" style={{ color: "#a3a3a3" }}>&copy; 2026 Flowter Systems. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
