import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: "Flowcore AI's Data Processing Agreement (DPA) governing how we process customer data as a processor under DPDP Act 2023.",
  openGraph: { title: "DPA - Flowcore AI", url: `${siteUrl}/legal/dpa` },
  alternates: { canonical: `${siteUrl}/legal/dpa` },
}

const content = `## 1. Parties

This Data Processing Agreement ("DPA") forms part of the Terms & Conditions between:

- **FlowCore AI** ("Processor"), operating from Chennai, Tamil Nadu, India
- The customer subscribing to FlowCore AI's services ("Controller")

---

## 2. Scope

This DPA governs the Processor's processing of Personal Data on behalf of the Controller when using the FlowCore AI platform. It applies to all Personal Data processed through the Service, including end-customer data routed through WhatsApp, webchat, and email channels.

---

## 3. Definitions

- **Personal Data:** Any information relating to an identified or identifiable natural person
- **Processing:** Any operation performed on Personal Data (collection, storage, use, transmission, deletion)
- **Data Principal:** The individual to whom the Personal Data relates
- **Data Fiduciary:** The entity determining the purpose and means of processing (Controller)
- **Data Processor:** The entity processing data on behalf of the Data Fiduciary
- **DPDP Act:** Digital Personal Data Protection Act, 2023 (India)
- **Sub-processor:** A third party engaged by the Processor to assist in processing

---

## 4. Processor Obligations

The Processor shall:

### 4.1 Instructions
Process Personal Data only on documented instructions from the Controller, unless required by law (in which case the Processor will inform the Controller before processing, unless prohibited).

### 4.2 Confidentiality
Ensure all personnel authorised to process Personal Data are bound by confidentiality obligations.

### 4.3 Security
Implement appropriate technical and organisational measures including:
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- Row-Level Security (RLS) for tenant data isolation
- Access controls and audit logging
- Regular security reviews

### 4.4 Sub-processors
The Controller authorises the following sub-processors:

| Sub-processor | Service | Location |
|---|---|---|
| **Supabase Inc.** | Database, Auth, Storage | US (multi-region) |
| **Railway Corp.** | GoWA WhatsApp hosting | US |
| **Groq Inc.** | AI model inference | US |
| **Razorpay Software Pvt Ltd** | Payment processing | India |

The Processor will notify the Controller at least **30 days** before adding or replacing any sub-processor.

### 4.5 Data Subject Rights
The Processor will assist the Controller in responding to Data Principal requests under the DPDP Act (access, correction, erasure, nomination, grievance) within the timelines prescribed by law.

### 4.6 Breach Notification
The Processor will notify the Controller within **48 hours** of becoming aware of a Personal Data breach affecting the Controller's data.

---

## 5. Controller Obligations

The Controller shall:
- Ensure it has a valid legal basis for processing Personal Data through the Service
- Provide a privacy policy to its end customers disclosing the use of AI in communications
- Respond to Data Principal requests within the timelines required by applicable law
- Not use the Service to process sensitive Personal Data (health, biometrics, caste, religion, sexual orientation) without explicit consent

---

## 6. Data Retention & Deletion

Upon termination of the Service:
- The Controller's Personal Data will be retained for **30 days**
- During this period, the Controller may request a data export
- After 30 days, all data is permanently deleted unless retention is required by law (e.g., payment records — 7 years)

---

## 7. Limitation of Liability

The Processor's liability under this DPA shall be subject to the limitations set out in the Terms & Conditions. The Processor's total liability for any data processing incident shall not exceed the amount paid by the Controller in the 3 months preceding the incident.

---

## 8. Governing Law

This DPA is governed by the laws of **India**. Disputes shall be resolved per the dispute resolution clause in the Terms & Conditions.

---

## 9. Contact

**FlowCore**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Agreement"
      lastUpdated="May 13, 2026"
      content={content}
    />
  )
}
