import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import Link from "next/link"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Blog — AI Customer Service, WhatsApp Automation & Business Tips",
  description: "Learn about AI-powered customer service, WhatsApp automation, business communication strategies, and tips for scaling your support operations with Flowcore AI.",
  keywords: [
    "AI customer service blog",
    "WhatsApp automation tips",
    "customer service AI",
    "business automation",
    "AI agents",
  ],
  openGraph: {
    title: "Blog — AI Customer Service Insights | Flowcore AI",
    description: "Practical guides and insights on AI customer service, WhatsApp automation, and scaling business communication.",
    url: `${siteUrl}/blog`,
    siteName: "Flowcore AI",
    images: [{ url: `${siteUrl}/api/og?title=Blog&subtitle=AI%20Customer%20Service%20Insights`, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — AI Customer Service Insights | Flowcore AI",
    description: "Practical guides and insights on AI customer service, WhatsApp automation, and scaling business communication.",
    images: [`${siteUrl}/api/og?title=Blog&subtitle=AI%20Customer%20Service%20Insights`],
  },
  alternates: { canonical: `${siteUrl}/blog` },
}

const posts = [
  {
    title: "How to Automate WhatsApp Customer Service Without Meta Cloud API",
    excerpt: "Learn how GoWA (Go WhatsApp API) lets you build automated customer service on WhatsApp using the multi-device protocol — no Meta Cloud API, no approval process, no business verification delays.",
    date: "2026-06-15",
    slug: "automate-whatsapp-without-meta-cloud-api",
    tags: ["WhatsApp", "GoWA", "Automation"],
  },
  {
    title: "AI vs Human: When to Automate and When to Escalate Customer Conversations",
    excerpt: "Not every customer conversation should be automated. Learn the signals that indicate when AI should handle a query and when it's time to bring in a human agent.",
    date: "2026-06-01",
    slug: "ai-vs-human-escalation-strategy",
    tags: ["AI Agents", "Customer Service", "Escalation"],
  },
  {
    title: "Building a Knowledge Base That Actually Makes Your AI Smarter",
    excerpt: "Your AI agent is only as good as its knowledge base. Learn best practices for structuring business documents, FAQs, and product information for maximum retrieval accuracy.",
    date: "2026-05-15",
    slug: "building-knowledge-base-for-ai",
    tags: ["Knowledge Base", "AI", "Best Practices"],
  },
]

export default function BlogPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <PublicNav />

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <header style={{ marginBottom: "64px" }}>
          <h1 style={{ fontSize: "54.8345px", fontWeight: 400, lineHeight: "63.0597px", letterSpacing: "-0.15667px", color: "#fff", margin: 0 }}>
            Blog
          </h1>
          <p style={{ fontSize: "15.667px", color: "#595859", marginTop: "12px" }}>
            Insights on AI customer service, WhatsApp automation, and scaling business communication.
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {posts.map((post) => (
            <article key={post.slug}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                {post.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: "11px", color: "#c65f39", background: "rgba(198,95,57,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 500, color: "#fff", margin: "0 0 8px", lineHeight: 1.3 }}>
                  {post.title}
                </h2>
              </Link>
              <p style={{ fontSize: "15.667px", lineHeight: 1.8, color: "#a3a3a3", margin: "0 0 8px" }}>
                {post.excerpt}
              </p>
              <time style={{ fontSize: "13px", color: "#595859" }}>{post.date}</time>
            </article>
          ))}
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Flowcore AI Blog",
            "description": "Insights on AI customer service, WhatsApp automation, and scaling business communication.",
            "url": `${siteUrl}/blog`,
            "blogPost": posts.map((post) => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "datePublished": post.date,
              "url": `${siteUrl}/blog/${post.slug}`,
            })),
          }),
        }} />
      </main>

      <PublicFooter />
    </div>
  )
}
