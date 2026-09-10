-- Activation staff now select existing asset rows and catalog services rather
-- than typing new assets into the activation form. Assets already have an
-- activation_id foreign key; service selections are snapshotted here so an
-- activation remains historically accurate if the catalog text later changes.
alter table public.activations
  add column if not exists service_selections jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activations_service_selections_is_array'
      and conrelid = 'public.activations'::regclass
  ) then
    alter table public.activations
      add constraint activations_service_selections_is_array
      check (jsonb_typeof(service_selections) = 'array');
  end if;
end
$$;

comment on column public.activations.service_selections is
  'Selected service catalog snapshots with activation-specific detail text.';
