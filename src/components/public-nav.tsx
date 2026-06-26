"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/changelog", label: "Changelog" },
  { href: "/about", label: "About" },
]

export function PublicNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(5,5,5,0.9)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        maxWidth: "1024px", margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px",
      }}>
        <Link href="/" style={{
          fontSize: "15.667px", fontWeight: 500, color: "#c0c0c0",
          textDecoration: "none", letterSpacing: "-0.01em",
        }}>
          FlowCore
        </Link>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "14px",
                color: pathname === link.href ? "#fff" : "#888",
                textDecoration: "none",
                fontWeight: pathname === link.href ? 500 : 400,
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" style={{
            fontSize: "14px", color: "#c65f39", textDecoration: "none", fontWeight: 500,
          }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

export function PublicFooter() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "48px 24px",
      maxWidth: "1024px",
      margin: "0 auto",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "32px",
        marginBottom: "48px",
      }}>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
            Product
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/features" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Features</Link>
            <Link href="/pricing" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Pricing</Link>
            <Link href="/faq" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>FAQ</Link>
            <Link href="/changelog" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Changelog</Link>
            <Link href="/sitemap" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Sitemap</Link>
          </nav>
        </div>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
            Company
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/about" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>About</Link>
            <a href="mailto:support@flowcore.ai" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Contact</a>
          </nav>
        </div>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
            Legal
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/legal/privacy-policy" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Privacy</Link>
            <Link href="/legal/terms" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Terms</Link>
            <Link href="/legal/cookie-policy" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Cookies</Link>
            <Link href="/legal/refund-policy" style={{ fontSize: "14px", color: "#888", textDecoration: "none" }}>Refunds</Link>
          </nav>
        </div>
      </div>
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <p style={{ fontSize: "13px", color: "#595859", margin: 0 }}>
          &copy; {new Date().getFullYear()} FlowCore. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "12px", color: "#595859" }}>SOC 2 — in progress</span>
          <span style={{ fontSize: "12px", color: "#595859" }}>GDPR-ready</span>
        </div>
      </div>
    </footer>
  )
}
