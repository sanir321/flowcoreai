import type { Metadata } from "next"
import Link from "next/link"
import { getSiteUrl } from "@/lib/site"
import { PublicNav, PublicFooter } from "@/components/public-nav"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Complete sitemap of Flowcore AI — find all pages including features, pricing, FAQ, changelog, about, and legal pages.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sitemap - Flowcore AI",
    description: "Complete sitemap of Flowcore AI.",
    url: `${siteUrl}/sitemap`,
    images: [
      {
        url: `${siteUrl}/api/og?title=Sitemap&subtitle=Flowcore%20AI`,
        width: 1200,
        height: 630,
        alt: "Flowcore AI Sitemap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sitemap - Flowcore AI",
    description: "Complete sitemap of Flowcore AI.",
    images: [`${siteUrl}/api/og?title=Sitemap&subtitle=Flowcore%20AI`],
  },
  alternates: { canonical: `${siteUrl}/sitemap` },
}

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },

  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/cookie-policy", label: "Cookie Policy" },
  { href: "/legal/refund-policy", label: "Refund Policy" },
  { href: "/legal/dpa", label: "Data Processing Agreement" },
  { href: "/legal/aup", label: "Acceptable Use Policy" },
  { href: "/legal/data-deletion", label: "Data Deletion & Export" },
]

export default function SitemapPage() {
  return (
    <>
      <PublicNav />
      <main style={{
        maxWidth: "640px", margin: "0 auto", padding: "64px 24px 96px",
        color: "#e0e0e0",
      }}>
        <h1 style={{
          fontSize: "28px", fontWeight: 500, color: "#fff",
          marginBottom: "8px", letterSpacing: "-0.02em",
        }}>
          Sitemap
        </h1>
        <p style={{
          fontSize: "15px", color: "#888", lineHeight: 1.6, marginBottom: "40px",
        }}>
          All pages on Flowcore AI organized for easy navigation.
        </p>
        <ul style={{
          listStyle: "none", padding: 0, margin: 0,
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="sitemap-link"
                style={{
                  display: "block", padding: "10px 16px",
                  color: "#c0c0c0", textDecoration: "none",
                  borderRadius: "8px", fontSize: "15px",
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <style>{".sitemap-link:hover{background:rgba(255,255,255,0.04)}"}</style>
        </ul>
      </main>
      <PublicFooter />
    </>
  )
}
