"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { ArrowUpRight, Check } from "lucide-react"

const sf = { fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }

export function PricingPageClient() {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/pricing/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#050505", ...sf }}>
      <header className="h-14 flex items-center justify-between px-6 lg:px-12 fixed top-0 left-0 right-0 z-[100]" style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="text-base font-medium tracking-tight" style={{ color: "#fff", letterSpacing: "-0.01em", textDecoration: "none" }}>
          FlowCore
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm font-normal transition-colors" style={{ color: "#a3a3a3", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>Sign In</Link>
          <Link href="/login" className="h-8 px-4 rounded-[100px] text-sm font-normal flex items-center gap-1 transition-all duration-300" style={{ background: "#c65f39", color: "#fff", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(198,95,57,0.35)" }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
          >
            Book Demo <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

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
                <span className="text-sm font-normal" style={{ color: "#595859" }}>Trusted by growing businesses</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            >
                {submitted ? (
                  <div className="p-8 rounded-3xl space-y-4 text-center" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(198,95,57,0.15)" }}>
                      <Check className="h-6 w-6" style={{ color: "#c65f39" }} />
                    </div>
                    <h2 className="text-lg font-normal tracking-tight" style={{ color: "#e5e5e5" }}>Request received</h2>
                    <p className="text-sm font-normal" style={{ color: "#595859" }}>
                      Thanks {firstName}! Our team will reach out within 2-4 hours.
                    </p>
                  </div>
                ) : (
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

                {error && (
                  <p className="text-xs font-normal text-center" style={{ color: "#ef4444" }}>{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 rounded-[100px] text-sm font-normal flex items-center justify-center gap-2 cursor-pointer border-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #c65f39 0%, #d9744a 100%)", color: "#fff" }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 0 30px rgba(198,95,57,0.3)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
                >
                  {loading ? "Sending..." : "Request Pricing"} {!loading && <ArrowUpRight className="h-4 w-4" />}
                </button>

                <p className="text-xs font-normal text-center" style={{ color: "#595859" }}>
                  Our team typically responds within 2-4 hours.
                </p>
              </div>
                )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
