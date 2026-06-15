import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Söhne', 'Inter', ui-sans-serif, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "rgba(198,95,57,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        color: "#c65f39",
        marginBottom: "24px",
      }}>
        404
      </div>
      <h1 style={{
        fontSize: "24px",
        fontWeight: 500,
        color: "#fff",
        margin: "0 0 8px",
      }}>
        Page not found
      </h1>
      <p style={{
        fontSize: "15px",
        color: "#888",
        margin: "0 0 32px",
        maxWidth: "400px",
        lineHeight: 1.6,
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: "16px" }}>
        <Link href="/" style={{
          display: "inline-block",
          padding: "10px 24px",
          background: "#c65f39",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
        }}>
          Go home
        </Link>
        <Link href="/features" style={{
          display: "inline-block",
          padding: "10px 24px",
          background: "rgba(255,255,255,0.06)",
          color: "#c0c0c0",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
        }}>
          View features
        </Link>
      </div>
    </div>
  )
}
