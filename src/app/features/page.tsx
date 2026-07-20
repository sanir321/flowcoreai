import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Features — AI Customer Service Automation",
  description: "Explore Flowter's features: AI agents, WhatsApp automation, unified inbox, knowledge base, analytics, and multi-channel orchestration.",
  keywords: [
    "AI customer service features",
    "WhatsApp automation features",
    "AI chatbot capabilities",
    "customer service software features",
    "unified inbox",
    "knowledge base management",
    "AI agent orchestration",
  ],
  openGraph: {
    title: "Features — AI Customer Service Automation | Flowter",
    description: "AI-powered customer service features: WhatsApp automation, unified inbox, knowledge base, analytics, and multi-channel orchestration.",
    url: `${siteUrl}/features`,
    siteName: "Flowter",
    images: [
      {
        url: `${siteUrl}/api/og?title=Features&subtitle=AI%20Customer%20Service%20Automation%20Capabilities`,
        width: 1200,
        height: 630,
        alt: "Flowter Features",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — AI Customer Service Automation | Flowter",
    description: "AI-powered customer service features: WhatsApp automation, unified inbox, knowledge base, analytics.",
    images: [`${siteUrl}/api/og?title=Features&subtitle=AI%20Customer%20Service%20Automation%20Capabilities`],
  },
  alternates: { canonical: `${siteUrl}/features` },
}

const features = [
  {
    category: "AI Agents",
    items: [
      {
        name: "Booking Agent",
        description: "Full appointment lifecycle — availability checks, slot booking, confirmations, rescheduling, and cancellations. Integrates with Google Calendar.",
      },
      {
        name: "Sales Agent",
        description: "Product discovery, catalog search, pricing, quote generation, comparison, objection handling, and purchase guidance.",
      },
      {
        name: "Support Agent",
        description: "Knowledge base Q&A, business information, policy explanations, complaint handling, escalation management, and sentiment-aware responses.",
      },
    ],
  },
  {
    category: "Channels",
    items: [
      {
        name: "WhatsApp",
        description: "Connect via GoWA (self-hosted WhatsApp Web API). No Meta Business API approval required. Scan a QR code and start messaging.",
      },
      {
        name: "Webchat Widget",
        description: "Embeddable widget for your website. Customizable colors, greeting messages, and branding. Works on any website or React app.",
      },

    ],
  },
  {
    category: "Platform",
    items: [
      {
        name: "Unified Inbox",
        description: "All conversations from WhatsApp and webchat in one place. Real-time updates, internal notes, and team collaboration.",
      },
      {
        name: "Knowledge Base",
        description: "Upload documents, FAQs, and business information. AI searches your knowledge base to answer customer questions accurately.",
      },
      {
        name: "Analytics Dashboard",
        description: "Track response times, resolution rates, customer satisfaction, and AI performance. Export reports for business review.",
      },
      {
        name: "Human Takeover",
        description: "Seamlessly switch from AI to human agent mid-conversation. Set escalation rules based on keywords, sentiment, or topic.",
      },
    ],
  },
  {
    category: "Enterprise",
    items: [
      {
        name: "Multi-Workspace",
        description: "Manage multiple businesses or departments from one account. Each workspace has its own AI agents, knowledge base, and settings.",
      },
      {
        name: "Enterprise Security",
        description: "Role-based access control, audit logging, tenant isolation, and data encryption. SOC 2 Type II certification in progress.",
      },
      {
        name: "API Access",
        description: "RESTful API for custom integrations. Automate workflows, sync data, and build custom solutions on top of Flowter.",
      },
    ],
  },
]

const howItWorks = [
  {
    step: "1",
    title: "Create your account",
    description: "Sign up with your email. No credit card required for the free tier.",
  },
  {
    step: "2",
    title: "Connect your channels",
    description: "Scan the WhatsApp QR code or embed the webchat widget on your website.",
  },
  {
    step: "3",
    title: "Train your AI",
    description: "Upload your knowledge base, set your business hours, and configure agent behavior.",
  },
  {
    step: "4",
    title: "Go live",
    description: "Your AI agents start handling customer conversations immediately.",
  },
]

export default function FeaturesPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Flowter Features",
          "description": "AI-powered customer service automation features for WhatsApp and webchat.",
          "itemListElement": features.flatMap((cat, ci) =>
            cat.items.map((item, ii) => ({
              "@type": "ListItem",
              "position": ci * 10 + ii + 1,
              "name": item.name,
              "description": item.description,
            }))
          ),
        })
      }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Set Up AI Customer Service with Flowter",
          "description": "Step-by-step guide to automating your customer service with AI-powered WhatsApp and webchat assistants.",
          "step": howItWorks.map((s) => ({
            "@type": "HowToStep",
            "name": s.title,
            "text": s.description,
          })),
          "totalTime": "PT30M",
        })
      }} />
      <PublicNav />

      <main>
        {/* Hero */}
        <section style={{ padding: "100px 24px 80px", textAlign: "center", maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 54px)", fontWeight: 400,
            lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#fff", margin: "0 0 20px",
          }}>
            Features built for<br />real customer service
          </h1>
          <p style={{ fontSize: "18px", color: "#888", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            Everything you need to automate customer conversations across WhatsApp and webchat — while keeping a human in the loop.
          </p>

        </section>

        {/* How it works */}
        <section style={{ padding: "60px 24px 80px", maxWidth: "1024px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "28px", fontWeight: 400, color: "#fff",
            margin: "0 0 48px", letterSpacing: "-0.01em",
          }}>
            How it works
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
          }}>
            {howItWorks.map((step) => (
              <div key={step.step}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: "rgba(198,95,57,0.15)", color: "#f9510b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", fontWeight: 600, marginBottom: "16px",
                }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#fff", margin: "0 0 8px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature categories */}
        {features.map((cat) => (
          <section key={cat.category} style={{ padding: "60px 24px", maxWidth: "1024px", margin: "0 auto" }}>
            <h2 style={{
              fontSize: "24px", fontWeight: 400, color: "#fff",
              margin: "0 0 32px", letterSpacing: "-0.01em",
              paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {cat.category}
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}>
              {cat.items.map((item) => (
                <div key={item.name} style={{
                  padding: "24px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#fff", margin: "0 0 8px" }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6, margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section style={{
          padding: "80px 24px", textAlign: "center",
          maxWidth: "620px", margin: "0 auto",
        }}>
          <h2 style={{
            fontSize: "32px", fontWeight: 400, color: "#fff",
            margin: "0 0 16px",
          }}>
            Ready to automate your customer service?
          </h2>
          <p style={{ fontSize: "16px", color: "#888", margin: "0 0 32px", lineHeight: 1.6 }}>
            Start with the free tier. No credit card required.
          </p>
          <Link href="/login" style={{
            display: "inline-block",
            padding: "12px 32px",
            background: "#f9510b",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "background 0.2s",
          }}>
            Get started free
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
