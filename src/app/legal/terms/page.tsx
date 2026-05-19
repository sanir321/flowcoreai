import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Flowcore AI's terms and conditions governing the use of our AI customer service platform and services.",
  openGraph: { title: "Terms & Conditions - Flowcore AI", url: `${siteUrl}/legal/terms` },
  alternates: { canonical: `${siteUrl}/legal/terms` },
}

const content = `## 1. Acceptance of Terms

By registering for or using FlowCore AI ("Service", "Platform"), you ("User", "Subscriber", "you") agree to be bound by these Terms and Conditions ("Terms"). If you are registering on behalf of a business, you represent that you have authority to bind that business.

If you do not agree, do not use the Service.

---

## 2. The Service

FlowCore AI provides a multi-tenant SaaS platform that enables businesses to:
- Deploy AI-powered customer service agents on WhatsApp
- Automate customer query handling, lead capture, and order support
- Manage conversation history, agent configuration, and analytics via a web dashboard

The Service is provided "as-is" subject to the plan you subscribe to and these Terms.

---

## 3. Accounts & Access

### 3.1 Registration
You must provide accurate and complete information during registration. You are responsible for keeping your credentials secure.

### 3.2 Acceptable Use
You agree **not** to:
- Use the Service to send spam, unsolicited messages, or bulk promotional content in violation of WhatsApp's policies
- Impersonate any person, brand, or government entity
- Upload or process illegal content, hate speech, or content that violates third-party rights
- Attempt to reverse-engineer, scrape, or extract the platform's source code or AI models
- Use the Service for any purpose that violates applicable Indian law or Meta/WhatsApp's Terms of Service

### 3.3 Account Suspension
We reserve the right to suspend or terminate your account immediately if you violate these Terms, without refund obligation.

---

## 4. Subscription Plans & Payments

### 4.1 Plans
FlowCore AI offers tiered subscription plans (Starter, Growth, Scale) billed monthly or annually.

### 4.2 Payments
All payments are processed via **Razorpay** in Indian Rupees (INR). By subscribing, you authorise recurring charges per your selected billing cycle.

### 4.3 Refund Policy
- **Monthly plans:** No refunds after the billing date.
- **Annual plans:** Pro-rata refund for unused months if requested within **7 days** of the renewal date.
- Refunds will be processed to the original payment method within **5–7 business days**.

### 4.4 Failed Payments
If a payment fails, we will retry up to 3 times over 5 days. After that, your account may be downgraded or suspended. Data is retained for 30 days post-suspension.

### 4.5 Taxes
All prices are exclusive of GST. Applicable GST will be added at checkout. A GST invoice will be issued for every transaction.

---

## 5. WhatsApp & Meta Compliance

Your use of FlowCore AI's WhatsApp integration is subject to:
- **Meta's WhatsApp Business Policy**
- **Meta's Commerce Policy**
- WhatsApp's messaging limits, opt-in requirements, and template approval processes

You are solely responsible for obtaining customer consent before messaging them via WhatsApp and for complying with all applicable WhatsApp Business policies. FlowCore AI is not liable for account bans imposed by Meta due to your violation of their policies.

---

## 6. AI-Generated Content

FlowCore AI uses large language models (via Groq AI — llama-3.3-70b-versatile) to generate automated responses on your behalf.

- You acknowledge that AI responses may occasionally be inaccurate, incomplete, or inappropriate.
- You are solely responsible for reviewing and configuring AI agent behaviour.
- We strongly recommend enabling human handoff for sensitive queries (refunds, legal matters, complaints).
- FlowCore AI makes no warranty that AI responses will be error-free or fit for any specific business purpose.

---

## 7. Intellectual Property

### 7.1 Our IP
All software, designs, trademarks, and content comprising the FlowCore AI platform are our exclusive property or licensed to us. You may not copy, reproduce, or redistribute any part of the platform.

### 7.2 Your IP
You retain full ownership of your business data, conversation data, and any content you upload. By using the Service, you grant us a limited, non-exclusive licence to process your data solely to operate and improve the Service.

### 7.3 Feedback
Any feedback, suggestions, or ideas you provide may be used by us without obligation to you.

---

## 8. Data & Privacy

Your use of the Service is also governed by our **Privacy Policy**. You acknowledge that:
- You are the Data Fiduciary for your customers' personal data processed through the platform.
- You will maintain a valid privacy policy for your end customers disclosing the use of AI in customer communication.

---

## 9. Limitation of Liability

To the maximum extent permitted by applicable law:

- FlowCore AI's total liability for any claim arising out of or related to these Terms shall not exceed the **amount you paid us in the 3 months preceding the claim**.
- We are not liable for indirect, incidental, consequential, or punitive damages, including loss of revenue, data, or business opportunity.
- We are not liable for downtime caused by WhatsApp/Meta, Supabase, Railway, or Razorpay infrastructure failures.

---

## 10. Service Level & Uptime

We target **99.5% monthly uptime** for the core dashboard and webhook processing. Scheduled maintenance will be notified 24 hours in advance via email and in-app banner. Uptime excludes downtime caused by third-party providers (WhatsApp, Supabase, Railway).

---

## 11. Termination

### 11.1 By You
You may cancel your subscription at any time from the Dashboard → Billing settings. Access continues until the end of the current billing period.

### 11.2 By Us
We may terminate or suspend your account for:
- Violation of these Terms or our Acceptable Use Policy
- Non-payment after the grace period
- Court order or regulatory requirement

### 11.3 Post-Termination
Upon termination, your data will be retained for 30 days, during which you may request an export. After 30 days, all data is permanently deleted.

---

## 12. Governing Law & Dispute Resolution

These Terms are governed by the laws of **India**. Any disputes shall first be attempted to be resolved through good-faith negotiation within **30 days**.

If unresolved, disputes shall be subject to **binding arbitration** under the **Arbitration and Conciliation Act, 1996**, with arbitration seated in **Chennai, Tamil Nadu**. Courts in Chennai shall have exclusive jurisdiction for non-arbitrable matters.

---

## 13. Changes to Terms

We may update these Terms at any time. We will notify you via email and in-app notification at least **7 days** before changes take effect. Continued use after the effective date constitutes acceptance.

---

## 14. Contact

For any questions regarding these Terms:

**FlowCore**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="May 12, 2026"
      content={content}
    />
  )
}
