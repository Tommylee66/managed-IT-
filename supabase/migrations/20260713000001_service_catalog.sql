-- Service catalog: master registers named "additional service" items (e.g.
-- VPN, priority incident response, security monitoring) with a price; staff
-- pick from this list when building a quote or change request instead of the
-- old hardcoded vpn/security/priority/visit-frequency rate fields. Selections
-- snapshot the name/rate/cost at selection time, same rule as
-- equipment_catalog (a later catalog edit never changes an already-issued
-- quote document).
create table service_catalog (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  monthly_rate numeric,
  monthly_cost numeric,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_service_catalog_updated_at
  before update on service_catalog
  for each row execute function update_updated_at_column();

alter table service_catalog enable row level security;

create policy "staff can read service_catalog" on service_catalog
  for select to authenticated using (is_active_staff());
create policy "master can insert service_catalog" on service_catalog
  for insert to authenticated with check (is_master());
create policy "master can update service_catalog" on service_catalog
  for update to authenticated using (is_master()) with check (is_master());
create policy "master can delete service_catalog" on service_catalog
  for delete to authenticated using (is_master());

-- Snapshot of chosen service catalog items for a given quote — see comment above.
alter table quotes add column service_selections jsonb not null default '[]';

-- Change requests record both the before/after service selections, same
-- pattern as old_equipment_selections/new_equipment_selections.
alter table change_requests add column old_service_selections jsonb not null default '[]';
alter table change_requests add column new_service_selections jsonb not null default '[]';
