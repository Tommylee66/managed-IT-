-- A contract row is created the instant a quote is converted, but that
-- moment isn't necessarily "확정" (finalized/confirmed) from the business's
-- point of view — the dashboard's revenue figures were counting every
-- 'contracted' row as real, confirmed business the moment it existed.
-- confirmed_at is a nullable timestamp (mirrors activation_date/invoices'
-- sent_at) rather than a new contract_status enum value, since it's an
-- orthogonal "did someone approve this" fact independent of the existing
-- contracted -> activated -> terminated lifecycle that activation/invoicing/
-- termination already key off of.
alter table contracts add column confirmed_at timestamptz null;
