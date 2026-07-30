-- One-time construction/installation fee per service catalog item.
--
-- Distinct from the existing flat monthly_rate: a service can also carry a
-- one_time_fee, billed either as a single lump sum ("one_time" — shown as
-- its own line on the quote/contract document, collected by staff outside
-- the automated monthly invoice pipeline) or spread evenly across the
-- contract's months ("monthly" — folded into the recurring monthly total
-- like a normal service row). Deliberately NOT wired into invoice-calc.ts:
-- that engine recomputes every invoice fresh from quote_snapshot.rows with
-- no per-row billing history, so a true fire-once mechanism there would be
-- a much larger change than this feature calls for.
create type service_billing_mode as enum ('one_time', 'monthly');

alter table service_catalog add column one_time_fee numeric;
alter table service_catalog add column one_time_cost numeric;
alter table service_catalog add column one_time_billing_mode service_billing_mode not null default 'one_time';
