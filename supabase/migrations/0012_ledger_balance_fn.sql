-- Server-side ledger balance.
-- ledgerBalance() previously selected every row for an account and summed them
-- in Node — O(all-time transactions) per call, and it runs on every clipper
-- page load (the header wallet pill). This does the sum in Postgres as an index
-- scan (account is already indexed via ledger_entries_account_idx).
--
-- Called only through the service-role client (admin()), so execute is granted
-- to service_role and revoked from the public API roles.

create or replace function public.ledger_balance(p_account text)
returns bigint
language sql
stable
security invoker
as $$
  select coalesce(sum(amount_poisha), 0)::bigint
  from public.ledger_entries
  where account = p_account;
$$;

revoke all on function public.ledger_balance(text) from public, anon, authenticated;
grant execute on function public.ledger_balance(text) to service_role;
