import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Flowcore AI with email OTP to manage your AI customer service assistants.",
  openGraph: {
    title: "Sign In - Flowcore AI",
    description: "Sign in to Flowcore AI with email OTP.",
    url: `${siteUrl}/login`,
  },
  alternates: { canonical: `${siteUrl}/login` },
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
