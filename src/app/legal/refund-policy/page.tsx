import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Flowter's refund and cancellation policy for our AI customer service platform subscriptions.",
  keywords: ["Flowter refund", "refund policy", "cancellation policy", "subscription refund"],
  openGraph: {
    title: "Refund Policy — Flowter",
    description: "Refund and cancellation terms for Flowter subscriptions.",
    url: `${siteUrl}/legal/refund-policy`,
    images: [{ url: `${siteUrl}/api/og?title=Refund%20Policy&subtitle=Subscription%20Cancellation%20%26%20Refunds`, width: 1200, height: 630, alt: "Refund Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund Policy — Flowter",
    images: [`${siteUrl}/api/og?title=Refund%20Policy&subtitle=Subscription%20Cancellation%20%26%20Refunds`],
  },
  alternates: { canonical: `${siteUrl}/legal/refund-policy` },
}

const content = `## 1. Overview

This Refund and Cancellation Policy applies to all subscriptions and purchases of Flowter ("Service"). By subscribing, you agree to the terms below.

---

## 2. Subscription Plans

We offer the following billing options:

| Plan | Billing Cycle | Refund Eligibility |
|---|---|---|
| **Starter** | Monthly | No refunds after billing date |
| **Growth** | Monthly / Annual | Monthly: no refunds. Annual: pro-rata within 7 days |
| **Scale** | Monthly / Annual | Monthly: no refunds. Annual: pro-rata within 7 days |

---

## 3. Refund Rules

### 3.1 Monthly Subscriptions
All monthly subscriptions are non-refundable once the billing cycle begins. You may cancel at any time, but access continues until the end of the current paid period.

### 3.2 Annual Subscriptions
If you cancel an annual plan within **7 days** of the renewal date, you are eligible for a **pro-rata refund** for the unused portion of the year. Refund requests beyond 7 days will not be honoured.

### 3.3 Refund Processing
Approved refunds will be processed to the original payment method within **5–7 business days**. For Razorpay transactions, refunds are subject to Razorpay's processing timelines.

---

## 4. How to Request a Refund

Email **zenosayz05@gmail.com** with:
1. Your registered email address
2. Plan name and billing period
3. Reason for cancellation

Refund requests are reviewed within **48 hours**.

---

## 5. Exceptions

Refunds are not available for:
- Usage beyond the plan's stated limits
- Account termination due to Terms of Service violation
- Downgrades mid-cycle (the new rate applies at next billing)
- Add-on purchases or one-time setup fees

---

## 6. Chargebacks

If you dispute a charge through your bank (chargeback) instead of contacting us first, your account will be immediately suspended, and you will lose access to all data. Contact us first — we will resolve the issue.

---

## 7. Changes to This Policy

We may update this policy at any time. Registered users will be notified via email at least **7 days** before changes take effect.

---

## 8. Contact

**Flowter**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      lastUpdated="May 13, 2026"
      content={content}
    />
  )
}
