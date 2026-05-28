"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

const sf = { fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }

export default function PricingPage() {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: "Industries", href: "/" },
    { label: "Customers", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Resources", href: "/" },
  ]

  return (
    <div className="min-h-screen" style={{ background: "#050505", ...sf }}>
      <header className="h-14 flex items-center justify-between px-6 lg:px-12 fixed top-0 left-0 right-0 z-[100]" style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="text-base font-medium tracking-tight" style={{ color: "#fff", letterSpacing: "-0.01em", textDecoration: "none" }}>
          FlowCore
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm font-normal transition-all duration-300 rounded-lg"
              style={{ color: item.label === "Pricing" ? "#fff" : "#a3a3a3", background: item.label === "Pricing" ? "rgba(198,95,57,0.1)" : "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; if (item.label !== "Pricing") e.currentTarget.style.background = "rgba(198,95,57,0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = item.label === "Pricing" ? "#fff" : "#a3a3a3"; if (item.label !== "Pricing") e.currentTarget.style.background = "transparent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm font-normal transition-colors" style={{ color: "#a3a3a3", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Sign In</Link>
          <Link href="/login" className="h-8 px-4 rounded-[100px] text-sm font-normal flex items-center gap-1 transition-all duration-300" style={{ background: "#c65f39", color: "#fff", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(198,95,57,0.35)" }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
          >
            Book Demo <ArrowUpRight className="h-3 w-3" />
          </Link>
          <button
            className="md:hidden p-2 cursor-pointer border-none"
            style={{ color: "#fff", background: "none" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[99] pt-14 md:hidden" style={{ background: "rgba(5,5,5,0.97)", backdropFilter: "blur(14px)" }} onClick={() => setMobileOpen(false)}>
          <nav className="flex flex-col items-center gap-2 p-8" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="w-full py-3 text-center text-sm font-normal rounded-lg transition-all"
                style={{ color: item.label === "Pricing" ? "#fff" : "#a3a3a3", background: item.label === "Pricing" ? "rgba(198,95,57,0.1)" : "transparent" }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="w-full border-none h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />
            <Link href="/login" className="w-full py-3 text-center text-sm font-normal" style={{ color: "#a3a3a3" }} onClick={() => setMobileOpen(false)}>Sign In</Link>
          </nav>
        </div>
      )}

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at 50% 15%, rgba(198,95,57,0.1) 0%, rgba(198,95,57,0.03) 40%, transparent 70%)" }} />

        <section className="relative z-10 min-h-screen flex items-center pt-20 pb-16 px-6 lg:px-12">
          <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
              className="space-y-6"
            >
              <h1 className="font-normal leading-[1.1] tracking-tight text-white" style={{ fontSize: "54.8345px", lineHeight: "63.0597px", letterSpacing: "-0.03em" }}>
                Meet with an{" "}
                <span style={{ background: "linear-gradient(135deg, #c65f39 0%, #e8845a 60%, #c65f39 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  AI expert
                </span>{" "}
                to price your use case
              </h1>
              <p className="max-w-lg leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#595859" }}>
                Automate high-volume conversations across voice and messaging with AI agents built for your business.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {["#c65f39", "#e8845a", "#d9744a"].map((color, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-[#050505] flex items-center justify-center text-[10px] font-bold" style={{ background: `${color}20`, color }}>AI</div>
                  ))}
                </div>
                <span className="text-sm font-normal" style={{ color: "#595859" }}>Trusted by 50+ hospitality teams</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <div className="p-8 rounded-3xl space-y-6" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="space-y-1 text-center">
                  <h2 className="text-lg font-normal tracking-tight" style={{ color: "#e5e5e5" }}>Request Pricing</h2>
                  <p className="text-sm font-normal" style={{ color: "#595859" }}>Fill in your details and our team will get back to you.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "First Name", placeholder: "John", value: firstName, setter: setFirstName },
                      { label: "Last Name", placeholder: "Doe", value: lastName, setter: setLastName },
                    ].map((field) => (
                      <div key={field.label} className="space-y-1.5">
                        <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>{field.label}</label>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.setter(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5" }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none" }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none" }}
                    />
                  </div>
                </div>

                <button
                  className="w-full py-3.5 rounded-[100px] text-sm font-normal flex items-center justify-center gap-2 cursor-pointer border-none transition-all duration-300"
                  style={{ background: "linear-gradient(135deg, #c65f39 0%, #d9744a 100%)", color: "#fff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 30px rgba(198,95,57,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
                >
                  Request Pricing <ArrowUpRight className="h-4 w-4" />
                </button>

                <p className="text-xs font-normal text-center" style={{ color: "#595859" }}>
                  Our team typically responds within 2-4 hours.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
