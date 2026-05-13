import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "Flowter's Acceptable Use Policy (AUP) defining prohibited activities and proper use of our AI platform.",
  openGraph: { title: "AUP - Flowter", url: `${siteUrl}/legal/aup` },
  alternates: { canonical: `${siteUrl}/legal/aup` },
}

const content = `## 1. Purpose

This Acceptable Use Policy ("AUP") governs your use of FlowCore AI ("Service"). By using the Service, you agree to comply with this policy. Violations may result in account suspension or termination.

---

## 2. Prohibited Content

You may not use the Service to process, transmit, or store content that:

- Contains hate speech, harassment, or incitement to violence
- Promotes illegal activities, terrorism, or organised crime
- Contains child sexual abuse material (CSAM) or exploitation content
- Violates intellectual property rights of any third party
- Contains malware, viruses, or malicious code
- Constitutes spam, phishing, or unsolicited bulk messaging
- Impersonates individuals, brands, or government entities
- Violates any applicable Indian law, including the IT Act, 2000

---

## 3. Prohibited Activities

You may not:

- Use the Service to send bulk promotional or marketing messages without recipient consent
- Configure AI agents to generate misleading, fraudulent, or deceptive content
- Scrape, crawl, or extract data from the platform without written permission
- Reverse-engineer, decompile, or attempt to access the source code
- Share account credentials or allow unauthorised access to your workspace
- Interfere with other users' access or the platform's infrastructure
- Use the Service in a way that violates WhatsApp's Business or Commerce Policies
- Bypass rate limits, security controls, or authentication mechanisms

---

## 4. WhatsApp-Specific Rules

All WhatsApp messaging must comply with:
- Meta's WhatsApp Business Policy
- WhatsApp's opt-in and opt-out requirements
- Applicable message-trading limits and template approval rules

You are solely responsible for obtaining documented consent from end customers before sending WhatsApp messages through the platform.

---

## 5. AI Agent Conduct

You must ensure your AI agents:
- Identify themselves as automated when appropriate
- Do not claim to be human
- Do not provide legal, medical, or financial advice unless supervised
- Include clear escalation paths to human agents
- Respect user opt-out requests across all channels

---

## 6. Enforcement

Violations of this AUP may result in:

| Severity | Action |
|---|---|
| **First minor violation** | Warning + 48-hour remediation period |
| **Repeat minor violation** | Temporary suspension + mandatory review |
| **Major violation** (spam, CSAM, fraud) | Immediate termination without refund |

We reserve the right to report illegal content or activities to law enforcement authorities.

---

## 7. Reporting Violations

If you become aware of a violation of this AUP, report it immediately to:

**Email:** **zenosayz05@gmail.com**

Reports will be investigated within **48 hours**. We will take appropriate action and may notify you of the outcome where permitted by law.

---

## 8. Changes to This Policy

We may update this AUP at any time. Continued use of the Service after changes take effect constitutes acceptance.

---

## 9. Contact

**FlowCore**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function AupPage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      lastUpdated="May 13, 2026"
      content={content}
    />
  )
}
