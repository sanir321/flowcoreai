-- Order redesign: add fields for customer phone (denormalized) and payment verification audit trail.
-- Owner notification phone reuses existing workspaces.owner_personal_phone column.

alter table public.orders
  add column if not exists customer_phone text,
  add column if not exists payment_verified_at timestamptz;
