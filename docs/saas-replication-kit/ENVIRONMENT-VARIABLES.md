# Environment Variables: The Replication Map

Use this list as a checklist when setting up a new environment.

## 1. Railway (GoWA Service)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `APP_BASIC_AUTH` | Basic auth for the GoWA API | `user:password` |
| `APP_WEBHOOK` | Target Supabase function | `https://[ref].supabase.co/functions/v1/gowa-webhook?apikey=[key]` |
| `APP_WEBHOOK_SECRET`| Shared secret for HMAC signing | `mysecret2026` |
| `APP_WEBHOOK_EVENTS`| Events to forward | `message,message.ack` |
| `APP_DEBUG` | Enables verbose logging | `true` |

## 2. Supabase (Edge Functions)
| Variable | Description | Where to get it |
| :--- | :--- | :--- |
| `GOWA_WEBHOOK_SECRET` | Shared secret to verify GoWA | Match Railway `APP_WEBHOOK_SECRET` |
| `GOWA_BASE_URL` | The public URL of GoWA | Railway Domain URL |
| `GOWA_API_KEY` | Basic auth for GoWA calls | Match Railway `APP_BASIC_AUTH` |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS for system tasks | Supabase API Settings |
| `KILO_GATEWAY_API_KEY` | API Key for LLM orchestration | Kilo.ai Dashboard |

## 3. Next.js App (.env.local)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public access key |
| `SUPABASE_SERVICE_ROLE_KEY` | (Keep this private - server only) |
| `GOWA_BASE_URL` | GoWA server address |
| `GOWA_API_KEY` | GoWA authentication |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `NEXT_PUBLIC_APP_URL` | Your website address (`localhost:3000`) |

---

## Security Warning
*   **NEVER** share your `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_CLIENT_SECRET`.
*   Ensure your `GOWA_WEBHOOK_SECRET` is strong (at least 32 characters) for production use.
