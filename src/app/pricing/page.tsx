import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { PricingPageClient } from "./pricing-client"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "AI Pricing & Plans",
  description: "Simple, transparent pricing for Flowter. Start free, scale as you grow. AI-powered customer service for WhatsApp and webchat.",
  keywords: [
    "Flowter pricing",
    "AI customer service pricing",
    "WhatsApp automation pricing",
    "customer service AI plans",
  ],
  openGraph: {
    title: "AI Pricing & Plans | Flowter",
    description: "Simple, transparent pricing for Flowter. Start free, scale as you grow.",
    url: `${siteUrl}/pricing`,
    siteName: "Flowter",
    images: [
      {
        url: `${siteUrl}/api/og?title=AI%20Pricing%20%26%20Plans&subtitle=Simple%2C%20Transparent%20Pricing%20for%20Flowter%20AI`,
        width: 1200,
        height: 630,
        alt: "Flowter Pricing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Pricing & Plans | Flowter",
    description: "Simple, transparent pricing for Flowter. Start free, scale as you grow.",
    images: [`${siteUrl}/api/og?title=Pricing&subtitle=Simple%2C%20Transparent%20Pricing%20for%20Flowter%20AI`],
  },
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
