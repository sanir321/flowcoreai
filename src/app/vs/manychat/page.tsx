import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"
import { PublicNav, PublicFooter } from "@/components/public-nav"
import { ArrowRight, Check, Zap, Shield, Sparkles } from "lucide-react"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Flowcore vs ManyChat (2026 Comparison) — AI WhatsApp Customer Support",
  description: "Compare Flowcore and ManyChat for WhatsApp automation and customer service. Learn why businesses choose Flowcore for autonomous AI agents, zero Meta Cloud API per-message fees, and intelligent human escalation.",
  keywords: [
    "Flowcore vs ManyChat",
    "ManyChat alternative",
    "WhatsApp AI automation",
    "ManyChat WhatsApp alternative",
    "AI customer service platform",
    "WhatsApp chatbot comparison",
  ],
  openGraph: {
    title: "Flowcore vs ManyChat — Which WhatsApp AI Support Platform is Best?",
    description: "In-depth comparison of Flowcore vs ManyChat for WhatsApp automation, AI agent capabilities, pricing, and ease of use.",
    url: `${siteUrl}/vs/manychat`,
    siteName: "Flowcore",
    images: [{ url: `${siteUrl}/api/og?title=Flowcore%20vs%20ManyChat&subtitle=WhatsApp%20AI%20Automation%20Comparison`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowcore vs ManyChat Comparison | Flowcore",
    description: "Compare Flowcore and ManyChat for WhatsApp AI automation, pricing, and human escalation.",
    images: [`${siteUrl}/api/og?title=Flowcore%20vs%20ManyChat&subtitle=WhatsApp%20AI%20Automation%20Comparison`],
  },
  alternates: { canonical: `${siteUrl}/vs/manychat` },
}

const comparisonData = [
  {
    feature: "Core Architecture",
    flowcore: "Autonomous AI Reasoning Agents",
    manychat: "Static Rule-Based Flow Builder",
    flowcoreAdvantage: true,
  },
  {
    feature: "WhatsApp Connectivity",
    flowcore: "GoWA QR Scan (No Meta API Markup)",
    manychat: "Meta Cloud API (Per-conversation markup)",
    flowcoreAdvantage: true,
  },
  {
    feature: "AI Knowledge Base RAG",
    flowcore: "Native Document, PDF, Web Scraping RAG",
    manychat: "Basic text snippets & external webhooks",
    flowcoreAdvantage: true,
  },
  {
    feature: "Human Escalation & Takeover",
    flowcore: "Instant Unified Inbox Handoff",
    manychat: "Basic Live Chat inbox",
    flowcoreAdvantage: true,
  },
  {
    feature: "Appointment Booking",
    flowcore: "Native Google Calendar Sync",
    manychat: "Requires third-party Zapier / Make",
    flowcoreAdvantage: true,
  },
  {
    feature: "Setup Complexity",
    flowcore: "5 Minutes (Upload docs & scan QR)",
    manychat: "Hours building complex flowchart decision trees",
    flowcoreAdvantage: true,
  },
  {
    feature: "Instagram / Facebook Automation",
    flowcore: "WhatsApp & Webchat Orchestration",
    manychat: "Native Instagram DM & FB Messenger",
    flowcoreAdvantage: false,
  },
]

export default function FlowcoreVsManyChatPage() {
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
            Flowcore vs ManyChat
          </h1>
          <p style={{ fontSize: "18px", color: "#a3a3a3", maxWidth: "680px", margin: "0 auto", lineHeight: 1.6 }}>
            Looking for a ManyChat alternative for WhatsApp? Discover why modern businesses switch to Flowcore’s autonomous AI agents for intelligent customer service and zero Meta API markups.
          </p>
        </div>

        {/* Executive Summary Card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", padding: "36px", marginBottom: "64px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 500, margin: "0 0 16px", color: "#fff" }}>The Short Summary</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#d4d4d4", margin: 0 }}>
            While <strong>ManyChat</strong> was built primarily as a visual flowchart builder for Instagram DM and Facebook Messenger marketing, <strong>Flowcore</strong> is engineered specifically as an <strong>autonomous AI customer service platform for WhatsApp and Webchat</strong>. Flowcore agents read your business documents, answer complex customer questions naturally, and handle calendar bookings without requiring you to draw hundreds of rigid flowchart arrows.
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
                  <th style={{ padding: "20px 24px", fontSize: "16px", color: "#a3a3a3", fontWeight: 500 }}>ManyChat</th>
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
                    <td style={{ padding: "18px 24px", fontSize: "14px", color: "#737373" }}>{row.manychat}</td>
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
            <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#fff", margin: "0 0 12px" }}>No Flowcharts to Maintain</h3>
            <p style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: 1.7, margin: 0 }}>
              ManyChat forces you to build massive decision trees for every possible user response. Flowcore uses AI RAG — just upload your menu, pricing, or FAQ PDF, and the AI agent resolves queries instantly.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "28px" }}>
            <Shield style={{ width: "24px", height: "24px", color: "#f9510b", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#fff", margin: "0 0 12px" }}>Zero WhatsApp API Markups</h3>
            <p style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: 1.7, margin: 0 }}>
              ManyChat requires Meta Cloud API access with per-conversation charges. Flowcore uses GoWA direct QR connection so you can message customers without extra Meta conversation markups.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center", background: "linear-gradient(180deg, rgba(249,81,11,0.1) 0%, rgba(5,5,5,0) 100%)", border: "1px solid rgba(249,81,11,0.2)", borderRadius: "24px", padding: "56px 24px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 400, color: "#fff", margin: "0 0 16px" }}>Ready to Switch to Autonomous WhatsApp AI?</h2>
          <p style={{ fontSize: "16px", color: "#a3a3a3", marginBottom: "32px" }}>Set up your AI customer agent in under 5 minutes.</p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f9510b", color: "#fff", padding: "14px 28px", borderRadius: "100px", textDecoration: "none", fontSize: "15px", fontWeight: 500 }}>
            Start Free Trial <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
        </div>

        {/* Schema Markup for Comparison Page */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Flowcore vs ManyChat",
            "description": "In-depth platform comparison between Flowcore and ManyChat for WhatsApp AI automation.",
            "url": `${siteUrl}/vs/manychat`,
          }),
        }} />
      </main>

      <PublicFooter />
    </div>
  )
}
