import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"
import { LegalPage } from "@/components/legal/legal-page"

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Data Deletion & Export",
  description: "How to request data deletion or export from Flowcore AI in compliance with DPDP Act 2023 and GDPR.",
  openGraph: { title: "Data Deletion - Flowcore AI", url: `${siteUrl}/legal/data-deletion` },
  alternates: { canonical: `${siteUrl}/legal/data-deletion` },
}

const content = `## 1. Your Right to Deletion

Under the Digital Personal Data Protection Act, 2023 (DPDP Act) and other applicable privacy laws, you have the right to request the deletion of your personal data held by us.

---

## 2. How to Request Deletion

### Option A: Self-Service (Recommended)
1. Log in to your FlowCore dashboard
2. Navigate to **Settings → Account**
3. Click **Delete Account**
4. Confirm your password/OTP
5. Your data will be queued for deletion

### Option B: Email Request
Send an email to **zenosayz05@gmail.com** with:
- Subject: "Account Deletion Request"
- Your registered email address
- Your workspace/business name

We will process your request within **7 business days**.

---

## 3. What Gets Deleted

When you request deletion, the following data is permanently removed:

| Data Type | Status |
|---|---|
| Account profile and credentials | Permanently deleted |
| Workspace configuration | Permanently deleted |
| AI agent prompts and settings | Permanently deleted |
| Conversation history | Permanently deleted |
| Contact list | Permanently deleted |
| Knowledge base documents | Permanently deleted |
| Usage and analytics logs | Permanently deleted |

---

## 4. What Is Retained

Some data must be retained by law:

| Data Type | Retention Reason | Duration |
|---|---|---|
| Payment/invoice records | Statutory (Income Tax Act) | 7 years |
| Transaction logs | Statutory (RBI requirements) | 5 years |
| Fraud/abuse records | Legal defence | 3 years |

These records are anonymised where possible and used only for legal and regulatory compliance.

---

## 5. Data Export Before Deletion

Before your data is deleted, you may request an export:

1. Go to **Settings → Data**
2. Click **Export My Data**
3. You will receive a download link via email within **24 hours**

The export includes all your conversation history, contacts, and configuration data in JSON format.

---

## 6. Timeline

| Step | Timeline |
|---|---|
| Deletion request received | Day 0 |
| Verification completed | Within 24 hours |
| Data export available (optional) | Within 24 hours |
| Permanent deletion completed | Within 30 days |
| Retention-only data marked | Within 7 days |
| Confirmation sent to you | Within 30 days |

---

## 7. Cancelling a Deletion Request

If you change your mind within **7 days** of submitting a deletion request, email **zenosayz05@gmail.com** to cancel. After 7 days, deletion is irreversible.

---

## 8. Contact

For questions about data deletion or to escalate a request:

**FlowCore**
Email: **zenosayz05@gmail.com**
Location: Chennai, Tamil Nadu, India`

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Data Deletion & Export"
      lastUpdated="May 13, 2026"
      content={content}
    />
  )
}
