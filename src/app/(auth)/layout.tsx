import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Flowcore AI. Access your AI-powered customer service dashboard.",
  openGraph: {
    title: "Sign In — Flowcore AI",
    description: "Sign in to Flowcore AI. Access your AI-powered customer service dashboard.",
    url: `${siteUrl}/login`,
  },
  alternates: {
    canonical: `${siteUrl}/login`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
