import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for Flowter's AI customer service orchestration platform. Pay as you grow.",
  openGraph: {
    title: "Pricing - Flowter",
    description: "Simple, transparent pricing for Flowter's AI customer service platform.",
    url: `${siteUrl}/pricing`,
  },
  alternates: { canonical: `${siteUrl}/pricing` },
}

const plans = [
  {
    name: "Starter",
    price: "₹1,999",
    period: "/month",
    desc: "For small businesses getting started with AI-powered customer service.",
    features: [
      "1 AI assistant",
      "Up to 500 conversations/mo",
      "WhatsApp + Webchat",
      "Knowledge base (3 docs)",
      "Email alerts",
      "Community support",
    ],
    cta: "Get Started",
    href: "/login",
  },
  {
    name: "Pro",
    price: "₹4,999",
    period: "/month",
    desc: "For growing teams that need more capacity and advanced features.",
    popular: true,
    features: [
      "3 AI assistants",
      "Up to 2,000 conversations/mo",
      "WhatsApp + Webchat + Gmail",
      "Knowledge base (20 docs)",
      "Escalation to human agents",
      "Google Calendar sync",
      "Google Sheets export",
      "Priority email support",
    ],
    cta: "Get Started",
    href: "/login",
  },
  {
    name: "Enterprise",
    price: "₹14,999",
    period: "/month",
    desc: "For organizations requiring custom solutions and dedicated infrastructure.",
    features: [
      "Unlimited AI assistants",
      "Unlimited conversations",
      "All channels + Slack",
      "Knowledge base (unlimited)",
      "Custom AI persona training",
      "Dedicated GoWA instance",
      "SLA guarantee (99.9%)",
      "Priority phone & email support",
    ],
    cta: "Contact Sales",
    href: "mailto:zenosayz05@gmail.com",
  },
]

const faqs = [
  {
    q: "What counts as a conversation?",
    a: "A conversation is a single customer session on any channel (WhatsApp, webchat, or email). Each session counts once regardless of how many messages are exchanged within it.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately; downgrades apply at the start of the next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a 7-day free trial on the Starter plan with no credit card required. You'll get full access to all Starter features during the trial period.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Yes. Annual plans come with a 20% discount compared to monthly billing. Contact us at zenosayz05@gmail.com for invoicing and enterprise procurement.",
  },
]

export default function PricingPage() {
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
          maxWidth: "1060px", margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", gap: "32px", height: "64px",
        }}>
          <Link href="/" style={{
            fontSize: "15.667px", fontWeight: 500, color: "#c0c0c0",
            textDecoration: "none", letterSpacing: "-0.01em",
          }}>
            FlowCore
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: "13px", color: "#595859", textDecoration: "none" }}>Sign In</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1060px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "64px", textAlign: "center" }}>
          <h1 style={{
            fontSize: "54.8345px", fontWeight: 400,
            lineHeight: "63.0597px", letterSpacing: "-0.15667px",
            color: "#fff", margin: 0,
          }}>
            Pricing
          </h1>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "12px" }}>
            Simple, transparent pricing. Pay as you grow.
          </p>
        </header>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "96px",
        }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.popular ? "#0a0a0a" : "transparent",
              border: plan.popular ? "1px solid rgba(198,95,57,0.3)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: "24px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}>
              {plan.popular && (
                <span style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  background: "#c65f39", color: "#fff",
                  fontSize: "11px", fontWeight: 600, padding: "4px 16px",
                  borderRadius: "100px", letterSpacing: "0.02em",
                }}>
                  Most Popular
                </span>
              )}
              <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                {plan.name}
              </h2>
              <p style={{ fontSize: "13.7086px", color: "#595859", margin: "0 0 24px", lineHeight: 1.6 }}>
                {plan.desc}
              </p>
              <div style={{ marginBottom: "32px" }}>
                <span style={{ fontSize: "42px", fontWeight: 400, color: "#fff", letterSpacing: "-0.02em" }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: "13.7086px", color: "#595859", marginLeft: "4px" }}>
                  {plan.period}
                </span>
              </div>
              <Link
                href={plan.href}
                style={{
                  display: "block", textAlign: "center", padding: "14px", borderRadius: "12px",
                  textDecoration: "none", fontSize: "13.7086px", fontWeight: 600,
                  marginBottom: "32px",
                  background: plan.popular ? "#c65f39" : "rgba(255,255,255,0.06)",
                  color: plan.popular ? "#fff" : "#c0c0c0",
                  opacity: 1,
                }}
              >
                {plan.cta}
              </Link>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", flex: 1 }}>
                {plan.features.map((feature, j) => (
                  <li key={j} style={{
                    padding: "8px 0", color: "#c0c0c0",
                    fontSize: "13.7086px", borderTop: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <span style={{ color: "#c65f39", fontSize: "14px" }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "28px", fontWeight: 400, color: "#fff",
            margin: "0 0 8px", letterSpacing: "-0.01em", textAlign: "center",
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "8px", marginBottom: "48px", textAlign: "center" }}>
            Everything you need to know about our pricing.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {faqs.map((faq, i) => (
              <div key={i}>
                <h3 style={{
                  fontSize: "17px", fontWeight: 500, color: "#fff",
                  margin: "0 0 6px", letterSpacing: "-0.01em",
                }}>
                  {faq.q}
                </h3>
                <p style={{
                  fontSize: "14px", lineHeight: 1.7, color: "#808080", margin: 0,
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px", textAlign: "center",
        fontSize: "13.7086px", color: "#595859",
      }}>
        <p>&copy; {new Date().getFullYear()} FlowCore. All rights reserved.</p>
        <p style={{ marginTop: "4px" }}>Contact: zenosayz05@gmail.com</p>
      </footer>
    </div>
  )
}
