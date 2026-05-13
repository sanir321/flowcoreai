import Script from "next/script"

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FlowCore Systems",
    "url": "https://flowter.ai",
    "logo": "https://flowter.ai/icon.svg",
    "description": "AI-powered customer service orchestration platform for WhatsApp and webchat.",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "zenosayz05@gmail.com",
      "contactType": "support"
    }
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Flowter",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Flowter",
    "url": "https://flowter.ai",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://flowter.ai/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Flowter?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowter is an AI-powered customer service orchestration platform. It connects WhatsApp and webchat to a single AI inbox, automating responses while keeping a human in the loop when needed."
        }
      },
      {
        "@type": "Question",
        "name": "Does Flowter require Meta/WhatsApp Business API approval?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Flowter uses GoWA (self-hosted WhatsApp Web API), which connects via QR code like WhatsApp Web. No Meta Business API approval or WABA number required."
        }
      },
      {
        "@type": "Question",
        "name": "What AI model does Flowter use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowter uses Groq AI (llama-3.3-70b-versatile) for fast inference with temperature set to 0.3 for consistent professional responses."
        }
      },
      {
        "@type": "Question",
        "name": "Can human agents take over from the AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Flowter includes a manual takeover feature that lets human operators pause the AI and handle conversations directly through the unified inbox."
        }
      },
      {
        "@type": "Question",
        "name": "Does Flowter support Google Calendar and Sheets?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Flowter integrates with Google Calendar for appointment booking and Google Sheets for automated lead capture and CRM synchronization."
        }
      },
      {
        "@type": "Question",
        "name": "How is my data protected?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All data is stored on Supabase with AES-256 encryption at rest and TLS in transit. Row-Level Security ensures tenant isolation. Email OTP authentication means no passwords are stored."
        }
      }
    ]
  }

  return (
    <>
      <Script id="organization-schema" type="application/ld+json" strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <Script id="software-schema" type="application/ld+json" strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <Script id="website-schema" type="application/ld+json" strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Script id="faq-schema" type="application/ld+json" strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  )
}
