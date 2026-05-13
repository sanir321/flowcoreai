# Indian Manual Billing Specification

## Overview
A credit-based billing system for the Indian market where users top up manually via WhatsApp/UPI.

## Database Changes
- `workspaces`: `credits_balance` (int), `plan_type` (starter/business/premium), `owner_personal_phone` (text).
- `billing_transactions`: Audit log of usage and top-ups.

## Logic
- Credits deducted per AI message.
- Alerts sent to owner's personal number at 100, 20, and 0 credits.
- "Buy Credits" button redirects to WhatsApp with a pre-filled message.
