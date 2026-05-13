import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { StructuredData } from "@/components/seo/structured-data";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CookieConsent } from "@/components/cookie-consent";
import { getSiteUrl, siteName, siteDescription } from "@/lib/site";

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
    default: "Flowter | Automated Business Communication & AI Service Assistants",
    template: "%s | Flowter",
  },
  description: siteDescription,
  keywords: ["AI customer service", "WhatsApp automation", "business AI assistants", "FlowCore", "automated communication", "AI orchestration"],
  authors: [{ name: "FlowCore Systems" }],
  openGraph: {
    title: "Flowter | Automated Business Communication",
    description: siteDescription,
    url: siteUrl,
    siteName: "Flowter",
      images: [],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowter | Automated Business Communication",
    description: siteDescription,
    images: [],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthGuard>
            <StructuredData />
            {children}
            <Toaster />
            <CookieConsent />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
