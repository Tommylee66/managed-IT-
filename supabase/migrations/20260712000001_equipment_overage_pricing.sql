-- Usage-based overage pricing on top of the flat monthly rate — the main
-- case is printer rental: "base rental fee + extra pages printed this
-- period × per-page rate". Generic on the catalog row so any category could
-- use it, but in practice only printer-type items will set these.
alter table equipment_catalog add column overage_rate numeric;
alter table equipment_catalog add column overage_cost numeric;
