-- RLS strategy: this is single-tenant internal tooling (no customer-facing
-- portal), so row-level filtering is simply "any active staff member can
-- read/write operational data." Field-level (column) masking for sensitive
-- data is handled in the application data-access layer, NOT here — Postgres
-- RLS can't restrict individual columns. RLS's job is authorization: who can
-- read/write/delete which rows, and which tables are master-only.

alter table profiles enable row level security;
alter table agents enable row level security;
alter table customers enable row level security;
alter table rates enable row level security;
alter table quotes enable row level security;
alter table contracts enable row level security;
alter table applications enable row level security;
alter table activations enable row level security;
alter table assets enable row level security;
alter table asset_history enable row level security;
alter table service_logs enable row level security;
alter table invoices enable row level security;
alter table change_requests enable row level security;
alter table termination_plans enable row level security;
alter table numbering_sequences enable row level security;
alter table audit_log enable row level security;

-- profiles: everyone can see their own row; master sees/updates all.
-- No client-side INSERT policy — rows are created only by the
-- handle_new_user trigger (security definer, bypasses RLS).
create policy "self can read own profile" on profiles
  for select to authenticated using (id = auth.uid());
create policy "master can read all profiles" on profiles
  for select to authenticated using (is_master());
create policy "master can update profiles" on profiles
  for update to authenticated using (is_master()) with check (is_master());

-- Generic pattern for operational tables: any active staff member can
-- read/insert/update; only master can delete.
do $$
declare
  t text;
begin
  foreach t in array array[
    'agents', 'customers', 'quotes', 'contracts', 'applications',
    'activations', 'assets', 'asset_history', 'service_logs',
    'invoices', 'change_requests', 'termination_plans'
  ]
  loop
    execute format(
      'create policy "active staff can read %1$I" on %1$I for select to authenticated using (is_active_staff())',
      t
    );
    execute format(
      'create policy "active staff can insert %1$I" on %1$I for insert to authenticated with check (is_active_staff())',
      t
    );
    execute format(
      'create policy "active staff can update %1$I" on %1$I for update to authenticated using (is_active_staff()) with check (is_active_staff())',
      t
    );
    execute format(
      'create policy "master can delete %1$I" on %1$I for delete to authenticated using (is_master())',
      t
    );
  end loop;
end $$;

-- rates: all staff can read (needed to run the quote calculator), but the
-- pricing/cost config itself can only be changed by master.
create policy "staff can read rates" on rates
  for select to authenticated using (is_active_staff());
create policy "master can update rates" on rates
  for update to authenticated using (is_master()) with check (is_master());

-- numbering_sequences: no direct client access at all — only next_number()
-- (security definer) touches this table. Master can inspect it for debugging.
create policy "master can read numbering_sequences" on numbering_sequences
  for select to authenticated using (is_master());

-- audit_log: master-only read; no INSERT/UPDATE/DELETE policy for any role —
-- writes happen exclusively through log_audit() (security definer).
create policy "master can read audit_log" on audit_log
  for select to authenticated using (is_master());
