import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Script from "next/script"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "About — Flowcore AI",
  description: "Flowcore AI is an AI-powered customer service orchestration platform for WhatsApp and webchat. Learn about our mission, team, and vision for automated customer communication.",
  keywords: [
    "about Flowcore AI",
    "AI customer service company",
    "WhatsApp automation platform",
    "customer service AI startup",
  ],
  openGraph: {
    title: "About — Flowcore AI",
    description: "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    url: `${siteUrl}/about`,
    siteName: "Flowcore AI",
    images: [
      {
        url: `${siteUrl}/api/og?title=About%20Flowcore%20AI&subtitle=AI%20Customer%20Service%20Orchestration%20Platform`,
        width: 1200,
        height: 630,
        alt: "About Flowcore AI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Flowcore AI",
    description: "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    images: [`${siteUrl}/api/og?title=About%20Flowcore%20AI&subtitle=AI%20Customer%20Service%20Orchestration%20Platform`],
  },
  alternates: { canonical: `${siteUrl}/about` },
}

export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <Script id="about-org-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About Flowcore AI",
            "url": `${siteUrl}/about`,
            "mainEntity": {
              "@type": "Organization",
              "name": "FlowCore Systems",
              "url": siteUrl,
              "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
              "foundingDate": "2025",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
              },
            },
          })
        }} />
      <PublicNav />

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "64px" }}>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 54px)", fontWeight: 400,
            lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#fff", margin: "0 0 20px",
          }}>
            About Flowcore AI
          </h1>
          <p style={{ fontSize: "18px", color: "#888", lineHeight: 1.6, maxWidth: "600px" }}>
            We&apos;re building the AI-powered customer service platform that helps businesses automate conversations without losing the human touch.
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          <section>
            <h2 style={{
              fontSize: "24px", fontWeight: 400, color: "#fff",
              margin: "0 0 16px", letterSpacing: "-0.01em",
            }}>
              Our Mission
            </h2>
            <p style={{ fontSize: "16px", color: "#c0c0c0", lineHeight: 1.8, margin: 0 }}>
              Small and medium businesses lose customers because they can&apos;t respond fast enough. Hiring support staff is expensive. Chatbots are rigid and impersonal. We built Flowcore AI to bridge that gap — AI agents that understand your business, respond professionally, and know when to hand off to a human.
            </p>
          </section>

          <section>
            <h2 style={{
              fontSize: "24px", fontWeight: 400, color: "#fff",
              margin: "0 0 16px", letterSpacing: "-0.01em",
            }}>
              What We Believe
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { title: "AI should assist, not replace", text: "The best customer service combines AI speed with human empathy. Our platform is designed for collaboration, not replacement." },
                { title: "Simplicity wins", text: "No complex setups, no API approvals, no developer required. Connect WhatsApp with a QR code. Deploy AI in minutes." },
                { title: "Your data, your control", text: "We don&apos;t train on your data. We don&apos;t sell your data. You own everything, and you can export or delete it anytime." },
                { title: "Transparency matters", text: "Clear pricing. No hidden fees. Open about what our AI can and can&apos;t do. Honest about limitations." },
              ].map((belief) => (
                <div key={belief.title} style={{
                  padding: "20px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#fff", margin: "0 0 6px" }}>
                    {belief.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: belief.text }} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{
              fontSize: "24px", fontWeight: 400, color: "#fff",
              margin: "0 0 16px", letterSpacing: "-0.01em",
            }}>
              By the Numbers
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "24px",
            }}>
              {[
                { value: "24/7", label: "Always-on AI coverage" },
                { value: "<10min", label: "Setup time" },
                { value: "99.5%", label: "Uptime target" },
                { value: "3", label: "AI agent types" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 400, color: "#c65f39", marginBottom: "4px" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{
              fontSize: "24px", fontWeight: 400, color: "#fff",
              margin: "0 0 16px", letterSpacing: "-0.01em",
            }}>
              Contact
            </h2>
            <p style={{ fontSize: "16px", color: "#c0c0c0", lineHeight: 1.8, margin: 0 }}>
              Questions, feedback, or partnership inquiries? Reach us at{" "}
              <a href="mailto:support@flowcore.ai" style={{ color: "#c65f39", textDecoration: "none" }}>
                support@flowcore.ai
              </a>
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
