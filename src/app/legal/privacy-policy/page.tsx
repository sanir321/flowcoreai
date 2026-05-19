import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Flowcore AI's privacy policy explains how we collect, use, store, and protect your data in compliance with DPDP Act 2023 and IT Act 2000.",
  openGraph: { title: "Privacy Policy - Flowcore AI", url: `${siteUrl}/legal/privacy-policy` },
  alternates: { canonical: `${siteUrl}/legal/privacy-policy` },
}

const content = `## 1. Introduction

FlowCore AI ("we", "our", "us") operates a WhatsApp-based AI customer service SaaS platform ("Service") designed for Indian small and medium businesses. This Privacy Policy explains how we collect, use, store, and protect your data when you use FlowCore AI.

By accessing or using our Service, you agree to the collection and use of information as described in this policy. This policy is compliant with the **Information Technology Act, 2000**, the **IT (Amendment) Act, 2008**, the **IT (Reasonable Security Practices) Rules, 2011**, and India's **Digital Personal Data Protection Act, 2023 (DPDP Act)**.

---

## 2. Information We Collect

### 2.1 Account & Business Information
- Business name, owner name, email address, phone number
- Business category, location, GST number (optional)
- Razorpay payment details (processed by Razorpay; we do not store card data)

### 2.2 WhatsApp & Conversation Data
- Customer phone numbers that interact with your WhatsApp Business number via GOWA
- Incoming and outgoing message content processed by our AI agent
- Message timestamps, delivery status, and metadata
- Custom AI agent configurations (prompts, tone, response rules) you define

### 2.3 Usage & Technical Data
- IP address, browser type, device type
- Pages visited, features used, session duration
- Error logs and performance metrics (Supabase logs)
- Webhook event data from WhatsApp Business API (via GOWA on Railway)

### 2.4 Customer Data (End-User Data)
Your customers' data (the people messaging your WhatsApp number) is processed on your behalf. You are the **Data Fiduciary** for your customers' data under the DPDP Act. We act as the **Data Processor**.

---

## 3. How We Use Your Information

| Purpose | Basis |
|---|---|
| Deliver and operate the WhatsApp AI agent | Contract performance |
| Process payments via Razorpay | Contract performance |
| Send service notifications and invoices | Contract performance |
| Improve AI response quality (anonymised) | Legitimate interest |
| Detect fraud, abuse, and policy violations | Legitimate interest |
| Comply with legal obligations | Legal requirement |
| Send product updates and offers (opt-in) | Consent |

We do **not** sell your data or your customers' data to any third party.

---

## 4. Data Storage & Security

- All data is stored on **Supabase** (hosted infrastructure with AES-256 encryption at rest and TLS in transit).
- WhatsApp message processing runs on **Railway** (GOWA server) with secure environment variables.
- We implement **Row-Level Security (RLS)** policies ensuring tenants cannot access each other's data.
- Authentication uses email OTP (one-time passwords) via Supabase Auth — no passwords stored. Agent PIN hashes use SHA-256.
- We conduct periodic security reviews and follow OWASP secure coding practices.

Despite best efforts, no method of transmission over the internet is 100% secure. In the event of a data breach affecting your personal data, we will notify you within **72 hours** of becoming aware, as required by applicable law.

---

## 5. Data Retention

| Data Type | Retention Period |
|---|---|
| Account data | Duration of subscription + 90 days after deletion |
| WhatsApp conversation logs | 90 days (configurable on higher plans) |
| Payment records | 7 years (statutory requirement) |
| Usage/analytics logs | 30 days rolling |
| Deleted account data | Permanently purged within 30 days of deletion request |

---

## 6. Third-Party Services

We use the following sub-processors:

| Service | Purpose | Data Shared |
|---|---|---|
| **Supabase** | Database, auth, storage | All app data |
| **GOWA (Railway)** | WhatsApp Business API gateway | Message content |
| **Groq AI** | AI model inference (llama-3.3-70b-versatile) | Message content (anonymised prompts) |
| **Razorpay** | Payment processing | Billing info |
| **WhatsApp Business API (Meta)** | Message delivery | Phone numbers, messages |

Each sub-processor is bound by their own data processing agreements. We do not share data with sub-processors beyond what is necessary to deliver the Service.

---

## 7. Your Rights (DPDP Act 2023)

As a Data Principal under the DPDP Act, you have the right to:

- **Access** your personal data we hold
- **Correct** inaccurate or incomplete data
- **Erase** your personal data (right to be forgotten)
- **Nominate** a representative to exercise rights on your behalf
- **Withdraw consent** at any time (without affecting lawfulness of prior processing)
- **Grievance redressal** — raise a complaint with our Data Protection Officer

To exercise any right, email: **zenosayz05@gmail.com**
We will respond within **30 days**.

---

## 8. Cookies

We use essential cookies for session authentication and preference storage. We do not use third-party advertising cookies. You may disable cookies in your browser, though some features may not function correctly.

---

## 9. Children's Privacy

FlowCore AI is a B2B platform intended for business owners aged 18 and above. We do not knowingly collect data from individuals under 18.

---

## 10. Changes to This Policy

We may update this policy from time to time. When we do, we will update the "Last Updated" date and notify registered users via email at least **7 days** before major changes take effect.

---

## 11. Contact & Grievance Officer

**FlowCore**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India

For DPDP Act grievances, you may also approach the **Data Protection Board of India** once operational.`

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="May 12, 2026"
      content={content}
    />
  )
}
