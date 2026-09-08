-- Printer rentals are quoted as "monthly rental includes N pages, extra
-- pages cost X each" — until now only the X part existed (overage_rate,
-- added in 20260712000001), so the included allowance had to be tracked
-- outside the system and staff had to subtract it by hand before entering
-- an "extra pages" figure. included_qty makes the allowance part of the
-- catalog item, so the usage figure entered on a quote is the raw meter
-- reading and the system does the subtraction.
--
-- NULL included_qty = no free allowance, which is exactly how every
-- existing row already behaves (every page entered was already billable),
-- so quotes issued before this migration price identically.
alter table equipment_catalog add column included_qty numeric;

-- Color printers meter and price mono and color pages separately, each with
-- its own free allowance. The pre-existing overage_rate/overage_cost/
-- included_qty stay the mono (and, for a mono-only printer, the only)
-- tier; these three add the color tier alongside it. All NULL = not a color
-- printer, i.e. every row that exists today.
alter table equipment_catalog add column color_included_qty numeric;
alter table equipment_catalog add column color_overage_rate numeric;
alter table equipment_catalog add column color_overage_cost numeric;
