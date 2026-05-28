"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

const sf = { fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }

export default function PricingPage() {
  const [email, setEmail] = useState("")
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

        <section className="relative z-10 flex flex-col items-center pt-36 pb-24 px-6 animate-fade-in-up" style={{ background: "linear-gradient(180deg, #0a0605 0%, #050505 50%)" }}>
          <div className="max-w-[700px] mx-auto text-center space-y-10">
            <div className="space-y-5">
              <h1 className="font-normal leading-[1.1] tracking-tight text-white" style={{ fontSize: "54.8345px", lineHeight: "63.0597px", letterSpacing: "-0.03em" }}>
                AI agents for{" "}
                <span style={{ background: "linear-gradient(135deg, #c65f39 0%, #e8845a 60%, #c65f39 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  hospitality
                </span>
              </h1>
              <p className="max-w-lg mx-auto leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#595859" }}>
                Automate guest services and internal operations with agents connected to all your systems.
              </p>
            </div>

            <div className="max-w-md mx-auto w-full animate-fade-in-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="flex p-1.5 rounded-2xl gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(198,95,57,0.2)", backdropFilter: "blur(8px)" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="flex-1 bg-transparent border-none px-4 py-2.5 text-sm font-normal outline-none"
                  style={{ color: "#fff" }}
                />
                <button
                  className="h-10 px-5 rounded-xl text-sm font-normal flex items-center gap-1.5 cursor-pointer border-none whitespace-nowrap"
                  style={{ background: "#c65f39", color: "#fff" }}
                >
                  See Conduit in action <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-6 pb-32">
          <div className="max-w-[1060px] mx-auto animate-fade-in-up" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}>
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
                  <div className="font-normal flex items-center gap-2" style={{ color: "#171717", fontSize: "13.7086px" }}><ArrowUpRight className="h-4 w-4" style={{ color: "#c65f39" }} /> Conversations</div>
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg" style={{ background: "#ffffff", border: "1px solid #e5e5e5" }}>
                      <div style={{ color: "#171717", fontSize: "11px" }}>Booking Inquiry</div>
                      <div style={{ fontSize: "10px", color: "#737373" }}>Checking availability for...</div>
                    </div>
                    <div className="p-2 rounded-lg opacity-40">
                      <div style={{ color: "#171717", fontSize: "11px" }}>Check-in Request</div>
                      <div style={{ fontSize: "10px", color: "#a3a3a3" }}>Early check-in possible?</div>
                    </div>
                    <div className="p-2 rounded-lg opacity-40">
                      <div style={{ color: "#171717", fontSize: "11px" }}>Amenity Question</div>
                      <div style={{ fontSize: "10px", color: "#a3a3a3" }}>Do you have a pool?</div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-6 flex flex-col justify-between h-full" style={{ background: "#ffffff" }}>
                  <div className="space-y-4">
                    <div style={{ color: "#171717", fontSize: "13.7086px", fontWeight: 500 }}>Workflow Builder</div>
                    <div className="grid grid-cols-3 gap-3">
                      {["Booking Confirmation", "Guest Check-in", "Maintenance Request"].map((wf, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
                          <div style={{ color: "#171717", fontSize: "12px", fontWeight: 500 }}>{wf}</div>
                          <div style={{ color: "#a3a3a3", fontSize: "10px", marginTop: "4px" }}>{[4, 6, 3][i]} steps</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl space-y-3" style={{ background: "#fafafa", border: "1px solid #e5e5e5" }}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(198,95,57,0.15)", color: "#c65f39" }}>AI</div>
                        <div>
                          <div style={{ color: "#171717", fontSize: "12px", fontWeight: 500 }}>AI Response</div>
                          <div style={{ color: "#525252", fontSize: "11px" }}>Processing booking for property 230CALST...</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(198,95,57,0.1)", color: "#c65f39" }}>Auto-resolved</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(0,0,0,0.04)", color: "#737373" }}>1.2s response</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 flex flex-col items-center px-6 pb-32">
          <div className="p-8 rounded-3xl w-full max-w-md space-y-6 animate-fade-in-up" style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", animationDelay: "0.9s", animationFillMode: "both" }}>
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-normal tracking-tight" style={{ color: "#e5e5e5" }}>Request Pricing</h2>
              <p className="text-sm font-normal" style={{ color: "#595859" }}>Fill in your details and our team will get back to you.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {["First Name", "Last Name"].map((label) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-normal" style={{ color: "#a3a3a3", letterSpacing: "0.02em" }}>{label}</label>
                    <input
                      type="text"
                      placeholder={label === "First Name" ? "John" : "Doe"}
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
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl text-sm font-normal outline-none transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#e5e5e5" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(198,95,57,0.4)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(198,95,57,0.08)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none" }}
                />
              </div>
            </div>

            <button
              onClick={() => window.location.href = "/contact"}
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
        </section>
      </main>
    </div>
  )
}
