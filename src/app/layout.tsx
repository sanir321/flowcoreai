import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StructuredData } from "@/components/seo/structured-data";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CookieConsent } from "@/components/cookie-consent";
import { PostHogProvider } from "@/components/posthog-provider";
import { QueryProvider } from "@/components/query-provider";
import { getSiteUrl, siteDescription } from "@/lib/site";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050505',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flowter — Automated Customer Service & AI Assistants",
    template: "%s | Flowter",
  },
  description: siteDescription,
  keywords: ["AI customer service", "WhatsApp automation", "business AI assistants", "Flowter", "automated communication", "AI orchestration"],
  authors: [{ name: "Flowter Systems" }],
  openGraph: {
    title: "Flowter — Automated Customer Service & AI Assistants",
    description: siteDescription,
    url: siteUrl,
    siteName: "Flowter",
    images: [
      {
        url: `${siteUrl}/api/og?title=Flowter%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`,
        width: 1200,
        height: 630,
        alt: "Flowter — AI Customer Service Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowter — Automated Customer Service & AI Assistants",
    description: siteDescription,
    images: [`${siteUrl}/api/og?title=Flowter%20AI&subtitle=Automated%20Customer%20Service%20%26%20AI%20Assistants`],
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "SxmdSGeyyW2UFS1-YFJ6M1bB1fJHNXDJD-ZtKkkeRJg",
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
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="msvalidate.01" content="C5EF23523AD2B0B7697B73B8836EDF96" />
      </head>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`} nonce={nonce}>
        <PostHogProvider>
          <QueryProvider>
            <CookieConsent />
            <AuthGuard>
              <StructuredData />
              {children}
              <Toaster />
            </AuthGuard>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
