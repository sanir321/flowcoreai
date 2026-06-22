-- Drop dead function: lock_booking_session was never called from any code
-- Slot availability is checked in application code (SELECT before INSERT)
drop function if exists public.lock_booking_session(p_session_id uuid);
