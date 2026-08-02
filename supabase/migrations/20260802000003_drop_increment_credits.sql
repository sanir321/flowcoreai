-- ==========================================
-- P1.1: Drop the unused `increment_credits` RPC
-- Created in 20260516182220_add_razorpay_columns.sql as an unhardened
-- SECURITY DEFINER (no search_path, no revokes). Zero callers in src/,
-- credits are only ever decremented. Remove it for fresh-deploy parity
-- with the live DB (already dropped there).
-- ==========================================
drop function if exists public.increment_credits(uuid, integer);
