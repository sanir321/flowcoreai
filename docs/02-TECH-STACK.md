# 02 — Tech Stack Reference
## FlowCore AI — Architecture & Integration Specification v4.0

---

## 1. Stack Overview

| Layer | Technology | Host |
|---|---|---|
| **Frontend** | Next.js 15 (App Router, TypeScript strict) | Vercel |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) | Supabase Cloud |
| **AI Execution** | `llama-3.3-70b-versatile` (Groq) | Groq Cloud |
| **Embeddings** | `all-MiniLM-L6-v2` | HuggingFace Inference API |
| **WhatsApp Bridge** | GoWA (Multi-device) | Railway |
| **Integrations** | Google Calendar & Google Sheets | Google Cloud Platform |

---

## 2. AI Model Architecture

### 🤖 AI Execution
- **Model**: `llama-3.3-70b-versatile`
- **Provider**: Groq Cloud
- **Temperature**: 0.3
- **Max Tokens**: 300
- **Role**: Single-pass AI response generation with function calling. Handles intent detection, KB retrieval, appointment booking, lead capture, and escalation in one call.
- **Fallback Models**: `openai/gpt-oss-120b`, `llama-3.1-8b-instant`
- **Persona**: Controlled via `workspace_agents` config.

### 🔢 Vector Embeddings
- **Model**: HuggingFace `all-MiniLM-L6-v2` (384 dimensions, padded to 1536)
- **Role**: Vectorizes Knowledge Base chunks during upload for similarity search.
- **Engine**: PostgreSQL `pgvector` with HNSW index.

---

## 3. Core Integrations

### 💬 WhatsApp Bridge (GoWA)
- **Engine**: Go-WhatsApp-Web-Multidevice
- **Hosting**: Railway
- **Webhooks**: Syncs inbound messages to `gowa-webhook` edge function.

### 📅 Google Workspace
- **Google Calendar**: Real-time availability checks and appointment scheduling.
- **Google Sheets**: Automated lead capture and CRM synchronization.
- **Auth**: Secure OAuth 2.0 flow with automated token refreshing.

---

## 4. Environment Variables Reference

| Variable | Description |
|---|---|
| `GOWA_BASE_URL` | Railway URL for WhatsApp bridge |
| `GROQ_API_KEY` | Authentication for Groq AI |
| `GOOGLE_CLIENT_ID` | OAuth credentials for Google Workspace |
| `HUGGINGFACE_API_KEY` | Authentication for HuggingFace Inference API |
