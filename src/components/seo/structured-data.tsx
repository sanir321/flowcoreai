"use client"

import Script from "next/script"

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FlowCore Systems",
    "url": "https://flowter.ai",
    "logo": "https://flowter.ai/logo.png",
    "sameAs": [
      "https://twitter.com/flowcore",
      "https://linkedin.com/company/flowcore"
    ]
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
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128"
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
          "text": "Flowter is an automated business communication platform that allows companies to deploy specialized AI assistants to manage customer conversations across WhatsApp and other channels with business-grade precision."
        }
      },
      {
        "@type": "Question",
        "name": "How does Flowter integrate with WhatsApp?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowter uses a secure WhatsApp Business Bridge to connect your existing phone numbers to our AI orchestration layer, enabling automated replies, scheduling, and data synchronization."
        }
      },
      {
        "@type": "Question",
        "name": "Does Flowter support human handover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Flowter includes a 'Manual Take Over' feature that allows human operators to pause the AI assistant and handle complex conversations directly through our unified inbox."
        }
      },
      {
        "@type": "Question",
        "name": "Can Flowter sync with Google Sheets and Calendar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Flowter features native integrations with Google Ecosystem nodes, allowing your AI assistants to read from and write to Google Sheets and manage appointments in Google Calendar automatically."
        }
      }
    ]
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
