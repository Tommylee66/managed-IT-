-- Per-item override for the monthly-rate-from-purchase-price suggestion
-- amortization period (previously a fixed constant per category in
-- src/components/admin/equipment-dialog.tsx: 18 months default, 13 for
-- printers). Null = fall back to that category default, same as today.
-- Purely a UI convenience for the admin form — never read by the pricing
-- engine, invoice/termination calc, or any customer-facing document.
alter table equipment_catalog add column suggestion_months integer;
