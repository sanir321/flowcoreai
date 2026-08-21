import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"
import { PublicNav, PublicFooter } from "@/components/public-nav"
import { ArrowRight, Check, Zap, Shield, Sparkles } from "lucide-react"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Flowcore vs Wati (2026 Comparison) — WhatsApp AI Customer Service",
  description: "Compare Flowcore and Wati for WhatsApp automation. Learn why businesses choose Flowcore for autonomous AI agent orchestration, instant QR code onboarding, and unified inbox handoff without expensive Wati subscription tiers.",
  keywords: [
    "Flowcore vs Wati",
    "Wati alternative",
    "WhatsApp automation alternative",
    "Wati WhatsApp alternative",
    "AI customer service platform",
    "WhatsApp API pricing comparison",
  ],
  openGraph: {
    title: "Flowcore vs Wati — Which WhatsApp Customer Support Platform Wins?",
    description: "In-depth comparison of Flowcore vs Wati for WhatsApp automation, AI agent RAG knowledge, pricing, and human takeover.",
    url: `${siteUrl}/vs/wati`,
    siteName: "Flowcore",
    images: [{ url: `${siteUrl}/api/og?title=Flowcore%20vs%20Wati&subtitle=WhatsApp%20Customer%20Service%20Comparison`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowcore vs Wati Comparison | Flowcore",
    description: "Compare Flowcore and Wati for WhatsApp customer support automation, pricing, and onboarding.",
    images: [`${siteUrl}/api/og?title=Flowcore%20vs%20Wati&subtitle=WhatsApp%20Customer%20Service%20Comparison`],
  },
  alternates: { canonical: `${siteUrl}/vs/wati` },
}

const comparisonData = [
  {
    feature: "WhatsApp Setup Method",
    flowcore: "Instant GoWA QR Scan (Zero verification delays)",
    wati: "Meta WABA Approval (Requires Facebook Business verification)",
    flowcoreAdvantage: true,
  },
  {
    feature: "AI Intelligence Level",
    flowcore: "Autonomous AI Agents (Support, Booking, Sales)",
    wati: "Keyword triggers & basic AI chatbot add-ons",
    flowcoreAdvantage: true,
  },
  {
    feature: "Knowledge Base RAG",
    flowcore: "Upload PDFs, URLs, CSVs for instant agent training",
    wati: "Manual FAQ entry & limited document parsing",
    flowcoreAdvantage: true,
  },
  {
    feature: "Calendar & Order Booking",
    flowcore: "Native Google Calendar & POS order sync",
    wati: "Requires third-party webhook integrations",
    flowcoreAdvantage: true,
  },
  {
    feature: "Human Handoff Inbox",
    flowcore: "Unified Real-Time Inbox with takeover alerts",
    wati: "Multi-agent shared inbox",
    flowcoreAdvantage: true,
  },
  {
    feature: "Pricing Transparency",
    flowcore: "Flat pricing with 0% markup on messages",
    wati: "Tiered user seat fees + Meta conversation markups",
    flowcoreAdvantage: true,
  },
]

export default function FlowcoreVsWatiPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <PublicNav />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "100px 24px 120px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(249, 81, 11, 0.1)", border: "1px solid rgba(249, 81, 11, 0.2)", borderRadius: "100px", padding: "6px 16px", marginBottom: "20px" }}>
            <Sparkles style={{ width: "14px", height: "14px", color: "#f9510b" }} />
            <span style={{ fontSize: "12px", color: "#f9510b", fontWeight: 500 }}>2026 Platform Comparison</span>
          </div>
          <h1 style={{ fontSize: "48px", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 20px" }}>
            Flowcore vs Wati
          </h1>
          <p style={{ fontSize: "18px", color: "#a3a3a3", maxWidth: "680px", margin: "0 auto", lineHeight: 1.6 }}>
            Looking for a Wati alternative for WhatsApp automation? Compare Flowcore's autonomous AI agents, instant QR code connectivity, and flat pricing to Wati.
          </p>
        </div>

        {/* Executive Summary Card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", padding: "36px", marginBottom: "64px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 500, margin: "0 0 16px", color: "#fff" }}>The Short Summary</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#d4d4d4", margin: 0 }}>
            While <strong>Wati</strong> relies strictly on Meta's official WhatsApp Business API (requiring business verification, Facebook Manager setup, and tiered per-user seat fees), <strong>Flowcore</strong> empowers businesses to connect instantly via GoWA QR scanning while providing <strong>true autonomous AI reasoning agents</strong> that book appointments, answer complex catalog queries, and escalate to human agents effortlessly.
          </p>
        </div>

        {/* Comparison Table */}
        <section style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 400, color: "#fff", marginBottom: "28px", textAlign: "center" }}>
            Feature Comparison at a Glance
          </h2>
          <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <th style={{ padding: "20px 24px", fontSize: "14px", color: "#a3a3a3", fontWeight: 500 }}>Feature</th>
                  <th style={{ padding: "20px 24px", fontSize: "16px", color: "#f9510b", fontWeight: 600 }}>Flowcore</th>
                  <th style={{ padding: "20px 24px", fontSize: "16px", color: "#a3a3a3", fontWeight: 500 }}>Wati</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: index === comparisonData.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "18px 24px", fontSize: "14px", color: "#e5e5e5", fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: "18px 24px", fontSize: "14px", color: "#fff", fontWeight: 500 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Check style={{ width: "16px", height: "16px", color: "#f9510b" }} />
                        {row.flowcore}
                      </span>
                    </td>
                    <td style={{ padding: "18px 24px", fontSize: "14px", color: "#737373" }}>{row.wati}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Core Pillars */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "28px" }}>
            <Zap style={{ width: "24px", height: "24px", color: "#f9510b", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#fff", margin: "0 0 12px" }}>Instant QR Onboarding</h3>
            <p style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: 1.7, margin: 0 }}>
              Skip days of Meta business verification and Facebook manager approvals. Connect your WhatsApp account to Flowcore in 60 seconds by scanning a QR code.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "28px" }}>
            <Shield style={{ width: "24px", height: "24px", color: "#f9510b", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#fff", margin: "0 0 12px" }}>AI Agent Knowledge Hub</h3>
            <p style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: 1.7, margin: 0 }}>
              While Wati requires manual chatbot keyword rules, Flowcore agents parse your complete website and documents automatically to deliver human-grade answers.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center", background: "linear-gradient(180deg, rgba(249,81,11,0.1) 0%, rgba(5,5,5,0) 100%)", border: "1px solid rgba(249,81,11,0.2)", borderRadius: "24px", padding: "56px 24px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 400, color: "#fff", margin: "0 0 16px" }}>Ready for Better WhatsApp Automation?</h2>
          <p style={{ fontSize: "16px", color: "#a3a3a3", marginBottom: "32px" }}>Automate 80%+ of customer support messages on WhatsApp today.</p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f9510b", color: "#fff", padding: "14px 28px", borderRadius: "100px", textDecoration: "none", fontSize: "15px", fontWeight: 500 }}>
            Get Started Free <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
        </div>

        {/* Schema Markup for Comparison Page */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Flowcore vs Wati",
            "description": "In-depth comparison between Flowcore and Wati for WhatsApp AI customer service automation.",
            "url": `${siteUrl}/vs/wati`,
          }),
        }} />
      </main>

      <PublicFooter />
    </div>
  )
}
