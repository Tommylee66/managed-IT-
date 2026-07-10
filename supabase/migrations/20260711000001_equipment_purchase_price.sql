-- One-time acquisition cost, used only to suggest a monthly_rate/monthly_cost
-- in the admin UI (purchase_price / 24 months) — master can always override
-- the suggested figures before saving.
alter table equipment_catalog add column purchase_price numeric;
