import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LandingPage } from "./home-client"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Flowcore AI — Automated Customer Service & AI Assistants",
  description: "AI-powered customer service for WhatsApp and webchat. AI handles questions and bookings 24/7 — and hands off to you when it matters.",
  keywords: [
    "AI customer service",
    "WhatsApp automation",
    "business AI assistants",
    "customer service AI",
    "WhatsApp AI bot",
    "automated customer support",
    "AI chatbot for business",
    "customer communication platform",
    "AI helpdesk",
    "WhatsApp business automation",
  ],
  openGraph: {
    title: "Flowcore AI — Automated Customer Service & AI Assistants",
    description: "AI-powered customer service orchestration platform for WhatsApp and webchat. Connect specialized AI agents to manage and resolve customer conversations.",
    url: siteUrl,
    siteName: "Flowcore AI",
    images: [
      {
        url: `${siteUrl}/api/og?title=Flowcore%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`,
        width: 1200,
        height: 630,
        alt: "Flowcore AI — AI Customer Service Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowcore AI — Automated Customer Service & AI Assistants",
    description: "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    images: [`${siteUrl}/api/og?title=Flowcore%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`],
  },
  alternates: {
    canonical: siteUrl,
  },
}

export default function HomePage() {
  return <LandingPage />
}
