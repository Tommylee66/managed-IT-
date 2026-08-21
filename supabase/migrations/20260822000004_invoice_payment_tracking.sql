-- Tracks how much of an invoice has actually been collected, separate from
-- sent_at (which only tracks email delivery) — commission payout is now
-- gated on this, not on the invoice merely having been issued/sent.
alter table invoices add column paid_amount numeric(15,2) null;
alter table invoices add column paid_at timestamptz null;

alter type service_log_type add value '결제확인';
