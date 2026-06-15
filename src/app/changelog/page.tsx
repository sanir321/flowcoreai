import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history and product updates for Flowcore AI's AI customer service orchestration platform.",
  keywords: [
    "Flowcore AI updates",
    "product changelog",
    "AI customer service updates",
    "platform release notes",
  ],
  openGraph: {
    title: "Changelog — Flowcore AI",
    description: "Release history and product updates for Flowcore AI.",
    url: `${siteUrl}/changelog`,
    siteName: "Flowcore AI",
    images: [
      {
        url: `${siteUrl}/api/og?title=Changelog&subtitle=Product%20Updates%20%26%20Release%20Notes`,
        width: 1200,
        height: 630,
        alt: "Flowcore AI Changelog",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog — Flowcore AI",
    description: "Release history and product updates for Flowcore AI.",
    images: [`${siteUrl}/api/og?title=Changelog&subtitle=Product%20Updates%20%26%20Release%20Notes`],
  },
  alternates: { canonical: `${siteUrl}/changelog` },
}

const changes = [
  {
    version: "0.7.0",
    date: "May 13, 2026",
    items: [
      "Legal pages: Privacy Policy, Terms, Cookie Policy, Refund Policy, DPA, AUP, Data Deletion",
      "Cookie consent banner with accept/reject options",
      "Self-service data export and account deletion in Settings",
      "Widget customization (accent color, greeting, theme, logo, header, form message)",
      "Widget instant preview with live color updates",
      "Terms & Privacy checkbox on signup (new users only)",
      "RLS enabled on rate_limits table",
      "Database index optimization for foreign keys",
      "RLS InitPlan performance fix (auth.uid → select auth.uid)",
      "GoWA WhatsApp integration verified",
    ],
  },
  {
    version: "0.6.0",
    date: "May 11, 2026",
    items: [
      "Migrated AI from Kilo Gateway to Groq (llama-3.3-70b-versatile)",
      "Added circuit breaker for Groq API calls",
      "Fixed WhatsApp message deduplication in queue worker",
      "Added conversation deduplication for burst messages",
      "Knowledge Base truncation at 1000 chars per item",
      "Escalation RPC with POSIX word boundary matching",
    ],
  },
  {
    version: "0.5.0",
    date: "May 7, 2026",
    items: [
      "Manual billing for India (Razorpay)",
      "Billing settings page with credit balance display",
      "Visual polish and compliance hardening",
      "Dashboard UI refinements",
    ],
  },
  {
    version: "0.4.0",
    date: "May 4, 2026",
    items: [
      "Visual polish pass across all pages",
      "WhatsApp compliance layer for GoWA integration",
      "FlowCore design language implementation",
      "Appointment booking functionality",
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,5,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: "820px", margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", gap: "32px", height: "64px",
        }}>
          <Link href="/" style={{
            fontSize: "15.667px", fontWeight: 500, color: "#c0c0c0",
            textDecoration: "none", letterSpacing: "-0.01em",
          }}>
            FlowCore
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "64px" }}>
          <h1 style={{
            fontSize: "54.8345px", fontWeight: 400,
            lineHeight: "63.0597px", letterSpacing: "-0.15667px",
            color: "#fff", margin: 0,
          }}>
            Changelog
          </h1>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "12px" }}>
            Latest updates and improvements to FlowCore.
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          {changes.map((release, i) => (
            <div key={i}>
              <div style={{
                display: "flex", alignItems: "baseline", gap: "16px",
                marginBottom: "20px",
              }}>
                <h2 style={{
                  fontSize: "28px", fontWeight: 400, color: "#fff",
                  margin: 0, letterSpacing: "-0.01em",
                }}>
                  v{release.version}
                </h2>
                <span style={{ fontSize: "14px", color: "#595859" }}>
                  {release.date}
                </span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {release.items.map((item, j) => (
                  <li key={j} style={{
                    padding: "8px 0 8px 24px",
                    position: "relative",
                    color: "#c0c0c0",
                    fontSize: "15.667px",
                    lineHeight: 1.7,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{
                      position: "absolute", left: "6px", top: "16px",
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: "#c65f39",
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px", textAlign: "center",
        fontSize: "13.7086px", color: "#595859",
      }}>
        <p>&copy; {new Date().getFullYear()} FlowCore. All rights reserved.</p>
      </footer>
    </div>
  )
}
