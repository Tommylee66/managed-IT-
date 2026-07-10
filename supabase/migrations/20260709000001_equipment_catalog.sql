-- Equipment catalog: master registers real device models once; staff pick
-- from this list when building a quote instead of typing free text. Quotes
-- snapshot the chosen model/spec text at creation time (not just a foreign
-- key) so a later catalog edit or deactivation never changes what an
-- already-issued quote document shows.
create table equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  category asset_type not null,
  model_name varchar(255) not null,
  spec_id text,
  spec_ko text,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_equipment_catalog_updated_at
  before update on equipment_catalog
  for each row execute function update_updated_at_column();

alter table equipment_catalog enable row level security;

create policy "staff can read equipment_catalog" on equipment_catalog
  for select to authenticated using (is_active_staff());
create policy "master can insert equipment_catalog" on equipment_catalog
  for insert to authenticated with check (is_master());
create policy "master can update equipment_catalog" on equipment_catalog
  for update to authenticated using (is_master()) with check (is_master());
create policy "master can delete equipment_catalog" on equipment_catalog
  for delete to authenticated using (is_master());

-- Snapshot of chosen catalog items for a given quote — see comment above.
alter table quotes add column equipment_selections jsonb not null default '[]';
