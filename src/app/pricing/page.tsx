"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { ArrowUpRight, MessageCircle } from "lucide-react"

const sf = { fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }

export default function PricingPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  return (
    <div className="min-h-screen" style={{ background: "#050505", ...sf }}>
      <header className="h-14 flex items-center justify-between px-6 lg:px-12 fixed top-0 left-0 right-0 z-[100]" style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.7) 100%)", backdropFilter: "blur(12px)" }}>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(198,95,57,0.4) 20%, rgba(198,95,57,0.6) 50%, rgba(198,95,57,0.4) 80%, transparent 100%)" }} />
        <div className="absolute inset-0 rounded-b-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(198,95,57,0.08) 0%, transparent 70%)" }} />
        <div className="flex items-center gap-2 relative z-10">
          <Link href="/" className="text-base font-medium tracking-tight" style={{ color: "#e5e5e5", letterSpacing: "-0.01em" }}>
            FlowCore
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 relative z-10">
          <Link href="/pricing" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#e5e5e5" }}>Pricing</Link>
          <Link href="/faq" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>FAQ</Link>
          <Link href="/changelog" className="px-4 py-2 text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Changelog</Link>
        </nav>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/login" className="hidden sm:inline text-sm font-normal transition-colors" style={{ color: "#a3a3a3" }} onMouseEnter={(e) => e.currentTarget.style.color = "#e5e5e5"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Sign In</Link>
          <Link href="/login" className="h-8 px-4 rounded-[100px] text-sm font-normal flex items-center gap-1" style={{ background: "#c65f39", color: "#fff", textDecoration: "none" }}>
            Book Demo <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="min-h-screen flex items-center px-6 lg:px-12 relative overflow-hidden" style={{ paddingTop: "56px" }}>
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at center, rgba(198,95,57,0.12) 0%, transparent 60%)" }} />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5 }} className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle, rgba(198,95,57,0.06) 0%, transparent 60%)" }} />

        <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h1 className="font-normal leading-[1.1] tracking-tight text-white" style={{ fontSize: "48px", lineHeight: "57.6px", letterSpacing: "-0.02em" }}>
                Meet with an{" "}
                <span style={{ background: "linear-gradient(135deg, #c65f39 0%, #e8845a 50%, #c65f39 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  AI expert
                </span>{" "}
                to price your use case
              </h1>
              <p className="leading-relaxed font-normal max-w-lg" style={{ fontSize: "15.667px", color: "#595859" }}>
                Automate high-volume conversations across voice and messaging with AI agents built for your business.
              </p>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "#0a0a0a", border: "2px solid #050505", color: "#a3a3a3" }}>
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-normal" style={{ color: "#e5e5e5" }}>Trusted by 500+ teams</div>
                <div className="text-xs font-normal" style={{ color: "#595859" }}>Enterprise-grade security & compliance</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="p-8 rounded-3xl space-y-6" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="space-y-1">
                <h2 className="text-lg font-normal tracking-tight" style={{ color: "#e5e5e5" }}>Request Pricing</h2>
                <p className="text-sm font-normal" style={{ color: "#595859" }}>Fill in your details and our team will get back to you.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5", boxShadow: "0 0 0 0 rgba(198,95,57,0)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "0 0 0 0 rgba(198,95,57,0)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5", boxShadow: "0 0 0 0 rgba(198,95,57,0)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "0 0 0 0 rgba(198,95,57,0)" }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5", boxShadow: "0 0 0 0 rgba(198,95,57,0)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "0 0 0 0 rgba(198,95,57,0)" }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-[100px] text-sm font-normal flex items-center justify-center gap-2 cursor-pointer border-none"
                style={{ background: "linear-gradient(135deg, #c65f39 0%, #d9744a 100%)", color: "#fff", boxShadow: "0 0 0 rgba(198,95,57,0)" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 30px rgba(198,95,57,0.3)" }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 rgba(198,95,57,0)" }}
              >
                Request Pricing <ArrowUpRight className="h-4 w-4" />
              </motion.button>

              <p className="text-xs font-normal text-center" style={{ color: "#595859" }}>
                Our team typically responds within 2-4 hours.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <motion.a
        href="#"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full flex items-center justify-center shadow-lg z-50"
        style={{ background: "#c65f39", color: "#fff" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-5 w-5" />
      </motion.a>
    </div>
  )
}
