import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Flowter with email OTP to manage your AI customer service assistants.",
  openGraph: {
    title: "Sign In - Flowter",
    description: "Sign in to Flowter with email OTP.",
    url: "https://flowter.ai/login",
  },
  alternates: { canonical: "https://flowter.ai/login" },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
