import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about Flowter's AI customer service platform, WhatsApp integration, pricing, and features.",
  keywords: [
    "Flowter FAQ",
    "AI customer service questions",
    "WhatsApp automation FAQ",
    "AI chatbot questions",
  ],
  openGraph: {
    title: "Frequently Asked Questions | Flowter",
    description: "Answers to common questions about Flowter's AI customer service platform.",
    url: `${siteUrl}/faq`,
    images: [
      {
        url: `${siteUrl}/api/og?title=FAQ&subtitle=Questions%20about%20Flowter%20AI`,
        width: 1200,
        height: 630,
        alt: "Flowter FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Flowter",
    description: "Answers to common questions about Flowter's AI customer service platform.",
    images: [`${siteUrl}/api/og?title=FAQ&subtitle=Questions%20about%20Flowter%20AI`],
  },
  alternates: { canonical: `${siteUrl}/faq` },
}

const faqs = [
  {
    q: "What is Flowter?",
    a: "Flowter is an AI-powered customer service orchestration platform. It connects WhatsApp and webchat to a single AI inbox, automating responses while keeping a human in the loop when needed.",
  },
  {
    q: "Which channels does Flowter support?",
    a: "WhatsApp (via GoWA) and a native webchat widget. Each channel connects through its own integration — you bring the credentials, we handle the rest.",
  },
  {
    q: "Do I need a Meta/WhatsApp Business API approval?",
    a: "No. Flowter uses GoWA (self-hosted WhatsApp Web API), which connects via QR code like WhatsApp Web. No Meta Business API approval or WABA number required.",
  },
  {
    q: "What AI model does Flowter use?",
    a: "We use Groq AI (llama-3.3-70b-versatile) for fast, reliable inference. Temperature is set to 0.3 for consistent professional responses, with a 300-token limit per reply.",
  },
  {
    q: "Can a human take over a conversation?",
    a: "Yes. Flowter supports escalation — when a customer asks for a human or triggers specific keywords, the conversation is automatically assigned to a human agent. You can also manually take over from the inbox.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We use Supabase Row-Level Security to ensure tenant isolation. Authentication is email OTP only — no passwords stored. See our Privacy Policy for details.",
  },
  {
    q: "How long is conversation data retained?",
    a: "Conversation logs are retained for 90 days by default. You can configure shorter retention periods in workspace settings. Deleted account data is purged within 30 days.",
  },
  {
    q: "Can I customise the AI agent's behaviour?",
    a: "Yes. You can configure custom prompts, tone instructions, knowledge base documents, and escalation rules from the dashboard. Each agent type (Support, Sales, Appointment Booking) has its own configuration.",
  },
  {
    q: "What happens if the GoWA server goes down?",
    a: "WhatsApp messaging will be unavailable until the GoWA server is restored. Other channels (webchat, email) continue working independently. You can host GoWA on your own infrastructure for better reliability.",
  },
  {
    q: "How do I get started?",
    a: "Sign up with your email, complete the onboarding flow (business profile + agent selection), scan the GoWA QR code to connect WhatsApp, and you're live. The setup takes under 10 minutes.",
  },
  {
    q: "What happens if my payment fails?",
    a: "We retry up to 3 times over 5 days. Your account is then suspended but data is retained for 30 days, giving you time to update billing details and restore access.",
  },
  {
    q: "Do you offer refunds?",
    a: "Monthly plans are non-refundable. Annual plans are eligible for a pro-rata refund within 7 days of renewal. See our Refund Policy for details.",
  },
]

export default function FaqPage() {
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
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a },
          })),
        })
      }} />
      <PublicNav />

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "64px" }}>
          <h1 style={{
            fontSize: "54.8345px", fontWeight: 400,
            lineHeight: "63.0597px", letterSpacing: "-0.15667px",
            color: "#fff", margin: 0,
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "12px" }}>
            Common questions about the platform.
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 style={{
                fontSize: "20px", fontWeight: 500, color: "#fff",
                margin: "0 0 8px", letterSpacing: "-0.01em",
              }}>
                {faq.q}
              </h3>
              <p style={{
                fontSize: "15.667px", lineHeight: 1.8, color: "#c0c0c0", margin: 0,
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
