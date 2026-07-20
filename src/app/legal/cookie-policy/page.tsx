import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Flowter's cookie policy explains how we use essential cookies for authentication and preferences.",
  keywords: ["Flowter cookies", "cookie policy", "essential cookies", "privacy cookies"],
  openGraph: {
    title: "Cookie Policy — Flowter",
    description: "How Flowter uses essential cookies.",
    url: `${siteUrl}/legal/cookie-policy`,
    images: [{ url: `${siteUrl}/api/og?title=Cookie%20Policy&subtitle=Essential%20Cookies%20%26%20Tracking`, width: 1200, height: 630, alt: "Cookie Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy — Flowter",
    images: [`${siteUrl}/api/og?title=Cookie%20Policy&subtitle=Essential%20Cookies%20%26%20Tracking`],
  },
  alternates: { canonical: `${siteUrl}/legal/cookie-policy` },
}

const content = `## 1. What Are Cookies

Cookies are small text files placed on your device when you visit a website. They help us operate the Service, improve performance, and enhance your experience.

---

## 2. Cookies We Use

| Type | Purpose | Duration |
|---|---|---|
| **Essential** | Session auth, CSRF token, login state | Session |
| **Preference** | Theme selection, language, UI settings | 1 year |
| **Analytics** | Page views, feature usage (anonymised) | 30 days |
| **Third-Party** | None currently used | — |

We do **not** use advertising cookies, tracking pixels, or cross-site tracking cookies.

---

## 3. Cookie Consent

When you first visit the Flowter dashboard, a cookie banner will appear asking for your consent to non-essential cookies. You may:

- **Accept all** — enable preference and analytics cookies
- **Reject all** — use essential cookies only
- **Customise** — select specific categories

You can change your preferences at any time from Settings → Privacy.

---

## 4. How to Disable Cookies

You can control cookies through your browser settings:

- **Chrome:** Settings → Privacy and Security → Cookies
- **Firefox:** Options → Privacy & Security → Cookies
- **Safari:** Preferences → Privacy → Cookies
- **Edge:** Settings → Cookies and site permissions

Disabling essential cookies may prevent the dashboard from functioning correctly.

---

## 5. Third-Party Services

Some third-party services we use (Supabase, Groq AI, Razorpay) may set their own cookies. These are governed by their respective privacy policies and are not under our control.

---

## 6. Updates

We may update this Cookie Policy at any time. Changes will be posted here with an updated "Last Updated" date.

---

## 7. Contact

For questions about our use of cookies:

**Flowter**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="May 13, 2026"
      content={content}
    />
  )
}
