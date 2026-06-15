import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StructuredData } from "@/components/seo/structured-data";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CookieConsent } from "@/components/cookie-consent";
import { PostHogProvider } from "@/components/posthog-provider";
import { QueryProvider } from "@/components/query-provider";
import { getSiteUrl, siteName, siteDescription } from "@/lib/site";
import { headers } from "next/headers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flowcore AI — Automated Customer Service & AI Assistants",
    template: "%s | Flowcore AI",
  },
  description: siteDescription,
  keywords: ["AI customer service", "WhatsApp automation", "business AI assistants", "FlowCore", "automated communication", "AI orchestration"],
  authors: [{ name: "FlowCore Systems" }],
  openGraph: {
    title: "Flowcore AI — Automated Customer Service & AI Assistants",
    description: siteDescription,
    url: siteUrl,
    siteName: "Flowcore AI",
    images: [
      {
        url: `${siteUrl}/api/og?title=Flowcore%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`,
        width: 1200,
        height: 630,
        alt: "Flowcore AI — AI Customer Service Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowcore AI — Automated Customer Service & AI Assistants",
    description: siteDescription,
    images: [`${siteUrl}/api/og?title=Flowcore%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "SxmdSGeyyW2UFS1-YFJ6M1bB1fJHNXDJD-ZtKkkeRJg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`} nonce={nonce}>
        <PostHogProvider>
          <QueryProvider>
            <AuthGuard>
              <StructuredData />
              {children}
              <Toaster />
              <CookieConsent />
            </AuthGuard>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
