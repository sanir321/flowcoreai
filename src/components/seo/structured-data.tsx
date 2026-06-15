import Script from "next/script"
import { getSiteUrl } from "@/lib/site"

export function StructuredData() {
  const siteUrl = getSiteUrl()

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FlowCore Systems",
    "url": siteUrl,
    "logo": `${siteUrl}/icon.svg`,
    "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    "foundingDate": "2025",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@flowcore.ai",
      "contactType": "customer service",
      "availableLanguage": "English",
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
    },
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Flowcore AI",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    "url": siteUrl,
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "0",
      "highPrice": "499",
      "offerCount": "3",
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Flowcore AI",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Flowcore AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowcore AI is an AI-powered customer service orchestration platform. It connects WhatsApp and webchat to a single AI inbox, automating responses while keeping a human in the loop when needed.",
        },
      },
      {
        "@type": "Question",
        "name": "Does Flowcore AI require Meta/WhatsApp Business API approval?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Flowcore AI uses GoWA (self-hosted WhatsApp Web API), which connects via QR code like WhatsApp Web. No Meta Business API approval or WABA number required.",
        },
      },
      {
        "@type": "Question",
        "name": "What AI model does Flowcore AI use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowcore AI uses Groq AI (llama-3.3-70b-versatile) for fast inference with temperature set to 0.3 for consistent professional responses.",
        },
      },
      {
        "@type": "Question",
        "name": "Can human agents take over from the AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Flowcore AI includes a manual takeover feature that lets human operators pause the AI and handle conversations directly through the unified inbox.",
        },
      },
      {
        "@type": "Question",
        "name": "How is my data protected?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All data is stored on Supabase with AES-256 encryption at rest and TLS in transit. Row-Level Security ensures tenant isolation. Email OTP authentication means no passwords are stored.",
        },
      },
    ],
  }

  return (
    <>
      <Script id="organization-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <Script id="software-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <Script id="website-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  )
}
