import Script from "next/script"
import { getSiteUrl } from "@/lib/site"

export function StructuredData() {
  const siteUrl = getSiteUrl()

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    "name": "FlowCore Systems",
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteUrl}/icon.svg`,
      "width": 192,
      "height": 192,
    },
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
    "sameAs": [],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    "name": "Flowcore AI",
    "url": siteUrl,
    "publisher": {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
    },
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Flowcore AI",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "AI-powered customer service orchestration platform for WhatsApp and webchat. Automate responses, manage conversations across channels, and maintain human oversight.",
    "url": siteUrl,
    "screenshot": `${siteUrl}/api/og?title=Flowcore%20AI&subtitle=AI%20Customer%20Service%20Platform`,
    "featureList": [
      "AI-powered customer service automation",
      "WhatsApp and webchat integration",
      "Unified inbox for all channels",
      "Human takeover and escalation",
      "Knowledge base management",
      "Real-time analytics and reporting",
      "Multi-workspace support",
      "Appointment and order management",
    ],
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "0",
      "highPrice": "499",
      "offerCount": "3",
      "availability": "https://schema.org/InStock",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
      },
      "author": {
        "@type": "Organization",
        "name": "Smol Launch",
      },
      "reviewBody": "Featured on Smol Launch as a top AI customer service platform.",
    },
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Flowcore AI",
    "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    "brand": {
      "@type": "Brand",
      "name": "FlowCore",
    },
    "category": "Business Software",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "0",
      "highPrice": "499",
      "offerCount": "3",
    },
  }

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Set Up AI Customer Service with Flowcore",
    "description": "Step-by-step guide to automating your customer service with AI-powered WhatsApp and webchat assistants.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Create your account",
        "text": "Sign up with your email address. No credit card required for the free tier.",
      },
      {
        "@type": "HowToStep",
        "name": "Connect your channels",
        "text": "Connect WhatsApp via QR code scanning or embed the webchat widget on your website.",
      },
      {
        "@type": "HowToStep",
        "name": "Train your AI assistant",
        "text": "Upload your knowledge base, FAQ documents, and business information to train the AI on your specific domain.",
      },
      {
        "@type": "HowToStep",
        "name": "Configure automation rules",
        "text": "Set up business hours, escalation rules, and human takeover triggers for seamless customer service.",
      },
    ],
    "totalTime": "PT30M",
  }

  return (
    <>
      <Script id="organization-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <Script id="website-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Script id="software-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <Script id="product-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="howto-schema" type="application/ld+json" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
    </>
  )
}
