"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "zenosayz05@gmail.com"
const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "FlowCore"

export function LegalPage({
  title,
  lastUpdated,
  content,
}: {
  title: string
  lastUpdated: string
  content: string
}) {
  const pathname = usePathname()

  const tabs = [
    { href: "/legal/privacy-policy", label: "Privacy Policy" },
    { href: "/legal/terms", label: "Terms & Conditions" },
    { href: "/legal/cookie-policy", label: "Cookie Policy" },
    { href: "/legal/refund-policy", label: "Refund Policy" },
    { href: "/legal/dpa", label: "DPA" },
    { href: "/legal/aup", label: "AUP" },
    { href: "/legal/data-deletion", label: "Data Deletion" },
  ]

  const rendered = content
    .replace(/\[contact@flowcoreai\.com\]/g, supportEmail)
    .replace(/\[FlowCore AI \/ Your Company Name\]/g, companyName)
    .replace(/<strong>/g, "").replace(/<\/strong>/g, "")

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5, 5, 5, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
          height: "64px",
        }}>
          <Link href="/" style={{
            fontSize: "15.667px",
            fontWeight: 500,
            color: "#c0c0c0",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}>
            FlowCore
          </Link>
          <div style={{
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            flex: 1,
          }}>
            {tabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "100px",
                    fontSize: "13.7086px",
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    background: isActive ? "rgba(198, 95, 57, 0.15)" : "transparent",
                    color: isActive ? "#c65f39" : "#595859",
                    transition: "all 0.3s",
                  }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main style={{
        maxWidth: "820px",
        margin: "0 auto",
        padding: "80px 24px 120px",
      }}>
        <header style={{ marginBottom: "64px" }}>
          <h1 style={{
            fontSize: "54.8345px",
            fontWeight: 400,
            lineHeight: "63.0597px",
            letterSpacing: "-0.15667px",
            color: "#fff",
            margin: 0,
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: "15.667px",
            color: "#595859",
            marginTop: "12px",
          }}>
            Last updated: {lastUpdated}
          </p>
        </header>

        <div style={{ color: "#c0c0c0", fontSize: "15.667px", lineHeight: 1.8 }}>
          {rendered.split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} style={{ height: "1em" }} />

            if (line.startsWith("### ")) {
              return (
                <h3 key={i} style={{
                  fontSize: "24px",
                  fontWeight: 400,
                  color: "#fff",
                  margin: "40px 0 16px",
                  letterSpacing: "-0.01em",
                }}>
                  {line.slice(4)}
                </h3>
              )
            }

            if (line.startsWith("## ")) {
              return (
                <h2 key={i} style={{
                  fontSize: "35.2508px",
                  fontWeight: 300,
                  lineHeight: "44.0635px",
                  color: "#fff",
                  margin: "56px 0 20px",
                  letterSpacing: "-0.15667px",
                }}>
                  {line.slice(3)}
                </h2>
              )
            }

            if (line.startsWith("| ")) {
              if (line.includes("---")) return null
              const cells = line.split("|").filter(Boolean).map(c => c.trim())
              const isHeader = line.includes("|---|---|") || cells.every(c => c.startsWith("---"))
              if (isHeader) return null

              return (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                  gap: "16px",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "14px",
                }}>
                  {cells.map((cell, j) => (
                    <span key={j} style={{
                      color: j === 0 ? "#c65f39" : "#c0c0c0",
                      fontWeight: j === 0 ? 500 : 400,
                    }}>
                      {cell.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </span>
                  ))}
                </div>
              )
            }

            if (line.startsWith("- ")) {
              return (
                <div key={i} style={{
                  paddingLeft: "20px",
                  position: "relative",
                  marginBottom: "6px",
                }}>
                  <span style={{
                    position: "absolute",
                    left: "6px",
                    top: "10px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#c65f39",
                  }} />
                  <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
                </div>
              )
            }

            if (line.startsWith("---")) {
              return <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "24px 0" }} />
            }

            const withBold = line.replace(/\*\*(.*?)\*\*/g, (_, bolded) => `**${bolded}**`)
            const parts = withBold.split(/(\*\*[^*]+\*\*)/g)

            return (
              <p key={i} style={{ margin: "0 0 12px" }}>
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} style={{ color: "#fff", fontWeight: 500 }}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            )
          })}
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px",
        textAlign: "center",
        fontSize: "13.7086px",
        color: "#595859",
      }}>
        <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
        <p style={{ marginTop: "4px" }}>
          Contact: {supportEmail}
        </p>
      </footer>
    </div>
  )
}
