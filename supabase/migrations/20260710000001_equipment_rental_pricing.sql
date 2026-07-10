-- Lets a catalog item be sold as a priced monthly rental line (e.g. BCT-
-- supplied/installed CCTV, printer rental), not just an informational spec
-- reference. NULL monthly_rate keeps the old "spec-only, no pricing" mode
-- working unchanged. monthly_cost is optional internal cost tracking so
-- margin math stays honest when a rate is set; masked from staff the same
-- way rates.cost_fields already is.
alter table equipment_catalog add column monthly_rate numeric;
alter table equipment_catalog add column monthly_cost numeric;

-- Change requests can now add/remove priced equipment (not just adjust the
-- QuoteInputs counts), and settle a prorated one-time amount for the current
-- partial month on top of changing the go-forward monthly fee.
alter table change_requests add column old_equipment_selections jsonb not null default '[]';
alter table change_requests add column new_equipment_selections jsonb not null default '[]';
alter table change_requests add column settlement_amount numeric not null default 0;
