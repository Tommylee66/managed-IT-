-- Reverting 20260731000001_equipment_suggestion_months.sql — this per-item
-- rate-suggestion override was scrapped in favor of keeping the fixed
-- category-based amortization defaults (18 months, 13 for printers) in
-- src/components/admin/equipment-dialog.tsx unchanged.
alter table equipment_catalog drop column if exists suggestion_months;
