import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Case Studies — Real Businesses Using Flowter",
  description: "See how businesses use Flowter to automate customer service, reduce response times, and scale support operations across WhatsApp and webchat.",
  keywords: [
    "Flowter case studies",
    "WhatsApp automation examples",
    "AI customer service success stories",
    "business automation case studies",
  ],
  openGraph: {
    title: "Case Studies — Flowter Customer Success Stories",
    description: "Real businesses automating customer service with Flowter.",
    url: `${siteUrl}/case-studies`,
    siteName: "Flowter",
    images: [{ url: `${siteUrl}/api/og?title=Case%20Studies&subtitle=Customer%20Success%20Stories`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies — Flowter Customer Success Stories",
    description: "Real businesses automating customer service with Flowter.",
    images: [`${siteUrl}/api/og?title=Case%20Studies&subtitle=Customer%20Success%20Stories`],
  },
  alternates: { canonical: `${siteUrl}/case-studies` },
}

const caseStudies = [
  {
    company: "Webuild LLP",
    industry: "Construction & Real Estate",
    headline: "80% of customer inquiries automated within 2 weeks",
    challenge: "Webuild LLP was receiving 200+ WhatsApp messages daily from prospective home buyers. A team of 4 sales reps spent 60% of their time answering the same questions about pricing, floor plans, and site visits.",
    solution: "Deployed Flowter with a custom-trained knowledge base containing all property listings, pricing sheets, and FAQ documents. Configured the Booking Agent for site visit scheduling synced with Google Calendar.",
    results: [
      "80% of inquiries handled without human intervention",
      "Average response time dropped from 4 hours to 15 seconds",
      "Sales team reclaimed 120 hours per month for high-value conversations",
      "Site visit bookings increased by 40% with 24/7 availability",
    ],
  },
  {
    company: "Tasty Bistro",
    industry: "Restaurant & Hospitality",
    headline: "Restaurant handles 1000+ reservation requests per week with one AI agent",
    challenge: "A busy restaurant chain was overwhelmed by phone calls and WhatsApp messages for reservations, menu inquiries, and event bookings during peak hours. Hosts were stretched thin managing both in-person guests and digital requests.",
    solution: "Implemented Flowter with a custom agent trained on the menu, pricing, table layouts, and reservation policies. Connected WhatsApp Business API for customer inquiries and automated order management.",
    results: [
      "95% of reservation requests handled automatically",
      "No-show rate reduced by 60% with automated reminders",
      "Staff focused on in-person guest experience instead of phone management",
      "Event booking inquiries converted at 3x the previous rate",
    ],
  },
  {
    company: "MediCare Clinics",
    industry: "Healthcare",
    headline: "Appointment booking AI saves 50 hours of admin work per week",
    challenge: "MediCare Clinics operated 5 locations with a centralized booking team handling 500+ appointment requests daily via phone, WhatsApp, and webchat. Long wait times led to patient frustration and missed appointments.",
    solution: "Deployed Flowter with Appointment Booking Agent trained on doctor schedules, insurance policies, and clinic locations. Integrated with Google Calendar for real-time slot availability and automated reminders.",
    results: [
      "70% of appointments booked without human involvement",
      "Patient wait time for booking reduced from 2 hours to instant",
      "Admin team reduced from 8 to 4 staff through automation",
      "Missed appointments dropped by 45% with AI-powered reminders",
    ],
  },
]

export default function CaseStudiesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <PublicNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "72px", textAlign: "center" }}>
          <h1 style={{ fontSize: "54.8345px", fontWeight: 400, lineHeight: "63.0597px", letterSpacing: "-0.15667px", color: "#fff", margin: 0 }}>
            Case Studies
          </h1>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "12px", maxWidth: "600px", margin: "12px auto 0" }}>
            Real businesses using Flowter to automate customer service, reduce response times, and scale support.
          </p>
        </header>

        {caseStudies.map((cs, i) => (
          <article key={cs.company} style={{ marginBottom: "80px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#f9510b", background: "rgba(198,95,57,0.1)", padding: "2px 10px", borderRadius: "4px" }}>
                {cs.industry}
              </span>
              <span style={{ fontSize: "13px", color: "#595859" }}>
                Case Study #{i + 1}
              </span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 500, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              {cs.company}
            </h2>
            <p style={{ fontSize: "18px", color: "#f9510b", margin: "0 0 24px", lineHeight: 1.4 }}>
              {cs.headline}
            </p>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "32px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  The Challenge
                </h3>
                <p style={{ fontSize: "15.667px", lineHeight: 1.8, color: "#c0c0c0", margin: 0 }}>
                  {cs.challenge}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  The Solution
                </h3>
                <p style={{ fontSize: "15.667px", lineHeight: 1.8, color: "#c0c0c0", margin: 0 }}>
                  {cs.solution}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Results
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cs.results.map((result) => (
                    <li key={result} style={{ fontSize: "15.667px", lineHeight: 1.8, color: "#c0c0c0", paddingLeft: "20px", position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#f9510b" }}>&#10003;</span>
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Flowter Case Studies",
            "description": "Real businesses using Flowter to automate customer service.",
            "itemListElement": caseStudies.map((cs, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Article",
                "headline": `${cs.company}: ${cs.headline}`,
                "description": cs.challenge,
              },
            })),
          }),
        }} />
      </main>

      <PublicFooter />
    </div>
  )
}
