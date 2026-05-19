export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export const siteName = "Flowcore AI"
export const siteDescription = "AI-powered customer service orchestration platform for WhatsApp and webchat."
