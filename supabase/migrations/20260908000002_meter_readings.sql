-- Actual per-month meter readings for usage-billed rental equipment
-- (printers). Until now the only usage figure in the system was the
-- estimate frozen on a contract's quote snapshot, so every month billed the
-- same quoted page count regardless of what the customer actually printed —
-- the quote/contract/invoice documents had to say as much ("계약 기준").
-- Engineers record the real counter during a routine inspection, and the
-- month's invoice bills from that instead.
--
-- Keyed by (contract, catalog item, month): one reading per rented model per
-- month. contract_no rather than customer_code alone, because a customer can
-- hold several contracts and the same printer model can be rented under more
-- than one — the reading has to bill against the right one.
create table meter_readings (
  id uuid primary key default gen_random_uuid(),
  contract_no varchar(20) not null references contracts(no) on delete cascade,
  -- Denormalised from the contract so per-customer reads (the monthly
  -- report) don't have to join through contracts.
  customer_code varchar(10) not null references customers(code),
  -- equipment_catalog rows are never referenced by FK anywhere else in this
  -- schema (quotes/contracts snapshot them into JSONB instead — see
  -- listUsedEquipmentCatalogIds), and a catalog row can be hard-deleted once
  -- unused. Kept as a plain id for the same reason, matched against the
  -- contract snapshot's catalogId.
  catalog_id uuid not null,
  -- 'YYYY-MM', matching the invoice/report month key convention.
  month varchar(7) not null,
  -- Pages counted this month. mono_qty is the only tier for a mono printer;
  -- a color printer meters both separately, mirroring the mono/color split
  -- on equipment_catalog. Raw counts, before the included allowance is
  -- deducted — the deduction belongs to pricing, not to the reading.
  mono_qty numeric not null default 0,
  color_qty numeric not null default 0,
  -- When the counter was actually read, which can differ from the month
  -- being billed (an inspection early in the following month, say).
  reading_date date,
  engineer varchar(100),
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One reading per model per contract per month; re-entering a month
  -- corrects the existing row rather than adding a second one that would
  -- double-bill.
  unique (contract_no, catalog_id, month)
);

create index meter_readings_customer_month_idx on meter_readings(customer_code, month);
create index meter_readings_contract_month_idx on meter_readings(contract_no, month);

alter table meter_readings enable row level security;

-- Same access tiers as incident_logs: readings are captured by the same
-- people during the same inspection visit.
create policy "activation role can read meter_readings" on meter_readings
  for select to authenticated using (has_role('master', 'activation_dept'));
create policy "activation role can insert meter_readings" on meter_readings
  for insert to authenticated with check (has_role('master', 'activation_dept'));
create policy "activation role can update meter_readings" on meter_readings
  for update to authenticated using (has_role('master', 'activation_dept')) with check (has_role('master', 'activation_dept'));
create policy "master can delete meter_readings" on meter_readings
  for delete to authenticated using (has_role('master'));
