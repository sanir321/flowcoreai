# FlowCore AI — Legal Documents

> **Company:** FlowCore AI (operated by Samir / FlowCore)
> **Product:** WhatsApp AI Customer Service SaaS for Indian SMBs
> **Effective Date:** May 12, 2026
> **Jurisdiction:** India (IT Act 2000, IT Rules 2011, DPDP Act 2023)

---

## AI Agent Instructions

> Use this block as the system prompt / task instruction when asking an AI agent (Claude, GPT, Gemini, etc.) to insert or render these legal documents into your app, website, or dashboard.

```
TASK: Insert the FlowCore AI Privacy Policy and Terms & Conditions into the application.

CONTEXT:
- Product: FlowCore AI — a multi-tenant WhatsApp AI Customer Service SaaS
- Target users: Indian SMBs (restaurants, retail, services)
- Stack: Next.js 15 App Router, Supabase, GOWA on Railway, Razorpay, Groq AI (llama-3.3-70b-versatile)
- Jurisdiction: India (IT Act 2000, DPDP Act 2023)
- Brand accent: #c34b22

INSTRUCTIONS:
1. Create two pages in the Next.js app:
   - /legal/privacy-policy → render the Privacy Policy section below
   - /legal/terms → render the Terms & Conditions section below
2. Each page must:
  - Use the FlowCore brand theme (font: Outfit/Inter headings, DM Sans body)
  - Include a sticky top nav with tabs linking between Privacy and Terms
   - Show last updated date dynamically
   - Be fully responsive (mobile-first)
   - Include an "Accept" or "Acknowledge" button if shown during onboarding
3. Link both pages in:
   - Footer of all marketing pages
   - Signup/registration flow (checkbox: "I agree to the Terms and Privacy Policy")
   - Dashboard settings → Legal section
4. Do NOT modify the legal text content — render it verbatim.
5. Replace all instances of [contact@flowcoreai.com] with the actual support email from env var NEXT_PUBLIC_SUPPORT_EMAIL (default: zenosayz05@gmail.com until set).
6. Replace [FlowCore AI / Your Company Name] with the value from env var NEXT_PUBLIC_COMPANY_NAME (default: "FlowCore" until set).

OUTPUT: Two Next.js page files + one shared LegalLayout component.
```

---

# Privacy Policy

**Last Updated:** May 12, 2026

## 1. Introduction

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

To exercise any right, email: **[contact@flowcoreai.com]**
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

**[FlowCore AI / Your Company Name]**
Email: **[contact@flowcoreai.com]**
Location: Chennai, Tamil Nadu, India

For DPDP Act grievances, you may also approach the **Data Protection Board of India** once operational.

---
---

# Terms and Conditions

**Last Updated:** May 12, 2026

## 1. Acceptance of Terms

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
FlowCore AI offers tiered subscription plans (Starter, Growth, Scale) billed monthly or annually. Plan details, pricing, and included features are listed on our Pricing page.

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

Your use of the Service is also governed by our **Privacy Policy** (above). You acknowledge that:
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

**[FlowCore AI / Your Company Name]**
Email: **[contact@flowcoreai.com]**
Location: Chennai, Tamil Nadu, India

---

*FlowCore AI — Automate your customer conversations. Own your growth.*
