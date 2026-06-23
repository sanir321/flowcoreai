# Order Collection Redesign — Plan

**Status:** Awaiting approval. No code changes yet.
**Author:** Claude (with samir1299)
**Date:** 2026-06-23

---

## 1. Context

The sales agent **cannot place orders** in the current modular TypeScript source (`supabase/functions/agent-orchestrator/`). Order-placement (`place_order`, `confirm_payment`, UPI link generation) existed in the old monolithic build (`index.js`, 127 KB, Jun 15) but was dropped during the Jun 18 refactor into the modular pipeline. The compiled JS bundles are now stale artifacts.

What still works today:
- Menu management UI (`/settings/menu`) and API (`/api/menu`)
- Agent can search the menu and send the catalog / menu image via WhatsApp (`manage_catalog`)
- Orders dashboard at `/orders` (read-only display + status PUT)
- `orders` table exists in the schema

What's broken:
- Agent has **no tool** to actually place an order
- Nothing inserts into `orders` from the source
- `/api/orders` has only `PUT` (status update), no `POST` create route

---

## 2. Goals

- Sales agent can collect a cart from a customer and place an order
- Customer receives a WhatsApp bill immediately
- Owner is notified on WhatsApp when an order arrives
- Owner can verify payment with a single tick in the dashboard
- Customer auto-receives a "payment received, thank you" WhatsApp when ticked

## 3. Non-goals

- No payment integration (no Stripe / Razorpay / UPI links)
- No tax calculation (owner sets product prices; total is just sum)
- No tracking of payment method / reference
- No quote feature (deprecating `generate_quote` — not needed for menu-based businesses)

---

## 4. Order lifecycle

| Stage | Trigger | System action |
|---|---|---|
| `pending` | Customer confirms cart; agent calls `place_order` | Insert into `orders`. Send bill WhatsApp to customer. Send notification WhatsApp to owner. |
| `paid` | Owner ticks "Payment verified" in dashboard | `PUT /api/orders` sets status. Auto-send WhatsApp to customer: *"Payment of ₹{total} received for Order {order_number}. Thank you!"* |
| `fulfilled` | Owner clicks "Mark fulfilled" after delivery | Status update only. (Optional follow-up message — disabled by default.) |
| `cancelled` | Owner clicks "Cancel" from any state | Status update. (Optional cancellation notice — disabled by default.) |

---

## 5. Agent design (`supabase/functions/agent-orchestrator/`)

### 5.1 New tool: `place_order`

Registered in `tools/registry.ts`, routed in `tools/executor.ts`, implemented in `tools/impl/order.ts`.

**Params:**
```ts
{
  items: [{ name: string, qty: number }],
  notes?: string
}
```

**Behavior:**
1. Resolve each item against `menu_items` (workspace_id scoped, `is_available = true`)
2. If any item not found → return `{ success: false, error, unknown_items: [...] }` so the agent can ask the user to pick from menu
3. Compute `subtotal = sum(qty × price)`, `total = subtotal` (no tax)
4. Get customer phone from `ctx.session.customer_jid` (strip `@s.whatsapp.net`)
5. Insert into `orders`:
   ```
   { workspace_id, contact_id, session_id, order_number: 'ORD-{base36 ts}',
     items: [{name, qty, price}], subtotal, total,
     customer_phone, status: 'pending', notes }
   ```
6. Fire (non-blocking, best-effort):
   - **Bill WhatsApp to customer** via GoWA `/send/message`
   - **Notification WhatsApp to owner** via GoWA `/send/message` to `workspaces.owner_whatsapp_phone`
7. Return `{ success: true, order_id, order_number, total, summary }`

### 5.2 Sales agent prompt (`agents/sales.ts`)

Rewrite the order-taking flow section:

```
## Order taking protocol
1. Use manage_catalog (action: search / send-catalog / send-media) to show options
2. Build the cart through conversation — ask "anything else?" until customer is done
3. READ BACK the cart for confirmation:
   "So that's 5× Chocolate Cake (₹500 each), 3× Sandwich (₹120 each). Total ₹2,860. Confirm to place order?"
4. ONLY after the customer explicitly confirms (yes / confirm / place it) → call place_order
5. On success, tell the customer their order number and that the owner will contact them for payment
```

Strip all payment / UPI / tax / quote language.

### 5.3 Tool surface changes

```ts
AGENT_TOOLS.sales = [
  "manage_catalog", "manage_contact", "get_business_info",
  "place_order",        // NEW
  "search_kb", "transfer_agent"
  // REMOVED: "generate_quote"
]
```

### 5.4 Deprecate `generate_quote`

- Remove from `ALL_TOOLS` in `registry.ts`
- Remove from `executor.ts` switch
- Remove `generateQuote` export from `tools/impl/crm.ts` (keep the rest)
- Leave `quotes` table in DB for now (no destructive migration; can drop later)

---

## 6. Schema changes

### Migration: `add_order_redesign_fields`

```sql
alter table public.workspaces
  add column if not exists owner_whatsapp_phone text;

alter table public.orders
  add column if not exists customer_phone text,
  add column if not exists payment_verified_at timestamptz;
```

Notes:
- `orders.customer_phone` is denormalized at order time so the dashboard and later WhatsApp sends don't need to join through sessions/contacts.
- `orders.payment_verified_at` is the audit trail for when the owner ticked the checkbox.
- Existing payment columns (`upi_link`, `payment_method`, `payment_ref`) stay nullable. Not removed; not used.
- Existing status enum is permissive (`text`). No enum migration needed.

---

## 7. Backend API (`src/app/api/orders/route.ts`)

Extend the existing `PUT` route:

- Allow status transitions: `pending → paid`, `paid → fulfilled`, `* → cancelled`
- On `pending → paid` transition:
  - Set `payment_verified_at = now()`
  - Look up `orders.customer_phone`, `orders.total`, `orders.order_number`
  - Look up workspace's `gowa_sessions.gowa_session_id`
  - Fire WhatsApp to customer (`/send/message`): *"Payment of ₹{total} received for Order {order_number}. Thank you!"*
  - Non-blocking; status update succeeds even if WhatsApp fails
- No new `POST` route — orders are created exclusively via the agent

---

## 8. Dashboard UI (`src/app/(dashboard)/orders/orders-client.tsx`)

- Remove: UPI link column, payment method badge
- Show columns: order #, customer phone, items summary, total, status, created_at
- Per-row controls based on status:
  - `pending` → **"Payment verified"** checkbox (ticking it PUTs status=paid)
  - `paid` → green "Paid" badge + **"Mark fulfilled"** button (PUT status=fulfilled)
  - `fulfilled` → grey "Fulfilled" badge (no actions)
  - any state → **"Cancel"** button (with confirm dialog)
- Status filter tabs: All / Pending / Paid / Fulfilled / Cancelled

---

## 9. Workspace settings UI

In existing settings (likely `src/app/(dashboard)/settings/*`):

- Add **"Owner WhatsApp number"** input
  - Placeholder: `+91 9876543210`
  - Validation: digits + `+` only, 10–15 chars
  - Stored in `workspaces.owner_whatsapp_phone`
- Surface a hint: *"This is where new orders will be notified."*

---

## 10. Files touched

### New
- (none — all changes are edits to existing files)

### Modified
- `supabase/functions/agent-orchestrator/tools/registry.ts` — add `place_order`, remove `generate_quote`, update `AGENT_TOOLS.sales`
- `supabase/functions/agent-orchestrator/tools/executor.ts` — route `place_order`, remove `generate_quote` case, update timeouts/rate limits
- `supabase/functions/agent-orchestrator/tools/impl/order.ts` — add `placeOrder` function with bill + owner-notify
- `supabase/functions/agent-orchestrator/tools/impl/crm.ts` — remove `generateQuote` export
- `supabase/functions/agent-orchestrator/agents/sales.ts` — rewrite prompt, drop quote/payment language
- `src/app/api/orders/route.ts` — extend PUT to fire customer thank-you on `paid` transition
- `src/app/(dashboard)/orders/orders-client.tsx` — checkbox UI + new buttons + remove UPI/payment columns
- Workspace settings page (path TBD during impl) — add owner WhatsApp number field
- New migration in `supabase/migrations/` — add schema fields

### Deleted
- `supabase/functions/agent-orchestrator/index.js` (127 KB stale bundle)
- `supabase/functions/agent-orchestrator/dist/index.js` (131 KB stale bundle)
- `supabase/functions/agent-orchestrator/dist/` directory (now empty)

---

## 11. Test plan

Before declaring done:

1. Menu seeded with 3+ items at different prices
2. Send a WhatsApp message to the workspace's GoWA number simulating a sales conversation
3. Verify the agent shows the menu, accepts a multi-item cart, reads it back, waits for confirmation
4. Confirm "yes" — verify:
   - Row appears in `orders` with correct items + total
   - Customer receives bill WhatsApp
   - Owner receives notification WhatsApp at the configured number
5. Open `/orders` dashboard, tick "Payment verified" — verify:
   - Status flips to `paid`
   - `payment_verified_at` is set
   - Customer receives "Payment of ₹X received. Thank you!" WhatsApp
6. Click "Mark fulfilled" — verify status flips to `fulfilled`, no extra messages
7. On a separate order, click "Cancel" — verify status flips to `cancelled`
8. Unknown item ("I want a unicorn burger") — verify agent rejects gracefully and asks customer to pick from menu
9. Owner WhatsApp number missing — verify order still saves and customer still gets bill (just no owner notification)

---

## 12. Out of scope (future work)

- Order modifications after placement (rare; customer would call owner)
- Partial payment tracking
- Refund flow
- Multi-currency (assumed INR `₹`)
- Per-item add-ons / variations
- Order timeline / activity log per order

---

## 13. Approval checklist

- [ ] Lifecycle (§4) is correct
- [ ] Agent flow with read-back confirmation (§5.2) is the right UX
- [ ] Schema additions (§6) are acceptable
- [ ] Dashboard UI changes (§8) match what you want
- [ ] Owner WhatsApp number lives in workspace settings (§9)
- [ ] Quotes feature can be removed (§5.4)
- [ ] Deleting stale bundles (§10) is fine

When all boxes are ticked, I'll implement in this order:
1. Migration
2. Edge function (`place_order` + sales prompt rewrite + remove quote)
3. Workspace settings field
4. `/api/orders` PUT extension
5. Dashboard UI
6. Delete stale bundles
7. Manual test pass
