import { getSiteUrl } from "@/lib/site"

function jsonLd(data: object) {
  return { __html: JSON.stringify(data) }
}

export function StructuredData() {
  const siteUrl = getSiteUrl()

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      "name": "FlowCore Systems",
      "url": siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteUrl}/icon.svg`, "width": 192, "height": 192 },
      "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
      "foundingDate": "2025",
      "contactPoint": { "@type": "ContactPoint", "email": "support@flowcore.ai", "contactType": "customer service", "availableLanguage": "English" },
      "address": { "@type": "PostalAddress", "addressCountry": "IN" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      "name": "Flowcore AI",
      "url": siteUrl,
      "publisher": { "@type": "Organization", "@id": `${siteUrl}#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${siteUrl}#webpage`,
      "url": siteUrl,
      "name": "Flowcore AI — Automated Customer Service & AI Assistants",
      "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
      "publisher": { "@type": "Organization", "@id": `${siteUrl}#organization` },
      "breadcrumb": { "@type": "BreadcrumbList", "@id": `${siteUrl}#breadcrumb` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Features", "item": `${siteUrl}/features` },
        { "@type": "ListItem", "position": 3, "name": "Pricing", "item": `${siteUrl}/pricing` },
        { "@type": "ListItem", "position": 4, "name": "FAQ", "item": `${siteUrl}/faq` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Flowcore AI",
      "operatingSystem": "Web",
      "applicationCategory": "BusinessApplication",
      "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
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
      "offers": { "@type": "AggregateOffer", "priceCurrency": "USD", "lowPrice": "0", "highPrice": "499", "offerCount": "3", "availability": "https://schema.org/InStock" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Flowcore AI",
      "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
      "brand": { "@type": "Brand", "name": "FlowCore" },
      "category": "Business Software",
      "offers": { "@type": "AggregateOffer", "priceCurrency": "USD", "lowPrice": "0", "highPrice": "499", "offerCount": "3" },
    },
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={`schema-${i}`} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      ))}
    </>
  )
}
