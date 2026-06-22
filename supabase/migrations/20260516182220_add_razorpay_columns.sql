-- Add Razorpay payment tracking columns to billing_transactions
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'billing_transactions') then
    alter table billing_transactions
      add column if not exists amount_paid integer,
      add column if not exists currency text not null default 'INR',
      add column if not exists razorpay_order_id text,
      add column if not exists razorpay_payment_id text,
      add column if not exists razorpay_signature text,
      add column if not exists payment_status text not null default 'pending'
        check (payment_status in ('pending','success','failed'));
  end if;
end;
$$;

create index if not exists idx_billing_razorpay_order on billing_transactions(razorpay_order_id)
  where razorpay_order_id is not null;

-- RPC to atomically increment workspace credits
create or replace function increment_credits(p_workspace_id uuid, p_credits integer)
returns void
language plpgsql
security definer
as \$\$
begin
  update workspaces
  set credits_balance = credits_balance + p_credits
  where id = p_workspace_id;
end;
\$\$;
