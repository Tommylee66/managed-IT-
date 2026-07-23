-- Run this AFTER 20260715000001_add_role_tiers.sql has been committed —
-- it uses the newly added enum values.

-- Every existing account was provisioned under the old 2-tier system as
-- 'staff'; the safest default under the new system is 'admin_dept' (the
-- broadest non-master tier), with master reassigning individuals to
-- activation_dept/sales_agent afterward as needed.
update profiles set role = 'admin_dept' where role = 'staff';
alter table profiles alter column role set default 'admin_dept';

-- New self-service signups (via /signup) should land as admin_dept too,
-- not the old 'staff' value.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'admin_dept',
    coalesce((new.raw_user_meta_data ->> 'pre_approved')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Generic role-check helper for policies that need to name specific tiers
-- (rather than "any active staff", which is_active_staff() already covers).
create or replace function has_role(variadic roles staff_role[])
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_active = true and is_approved = true and role = any(roles)
  );
$$ language sql security definer stable;

-- activations: was gated on "any active staff" via the generic loop in
-- 20260706160009_rls_policies.sql — now restricted to master + activation_dept
-- (admin_dept and sales_agent no longer get 개통 access).
drop policy "active staff can read activations" on activations;
drop policy "active staff can insert activations" on activations;
drop policy "active staff can update activations" on activations;

create policy "activation role can read activations" on activations
  for select to authenticated using (has_role('master', 'activation_dept'));
create policy "activation role can insert activations" on activations
  for insert to authenticated with check (has_role('master', 'activation_dept'));
create policy "activation role can update activations" on activations
  for update to authenticated using (has_role('master', 'activation_dept')) with check (has_role('master', 'activation_dept'));
-- "master can delete activations" policy is untouched.

-- 장애처리 및 정기점검 (incident handling & regular inspection). Deliberately
-- separate from the older, free-text service_logs table — this one has
-- structured fields so a month's records can be assembled into a customer
-- report. Restricted to master + activation_dept, matching the new
-- dedicated menu's access list (admin_dept is explicitly excluded from this
-- menu per the role spec).
create type incident_log_type as enum ('incident', 'inspection');

create table incident_logs (
  id uuid primary key default gen_random_uuid(),
  customer_code varchar(10) not null references customers(code),
  type incident_log_type not null,
  occurred_date date not null,
  title varchar(255) not null,
  description text not null,
  resolution text,
  engineer varchar(100),
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index incident_logs_customer_code_idx on incident_logs(customer_code);
create index incident_logs_occurred_date_idx on incident_logs(occurred_date);

alter table incident_logs enable row level security;

create policy "activation role can read incident_logs" on incident_logs
  for select to authenticated using (has_role('master', 'activation_dept'));
create policy "activation role can insert incident_logs" on incident_logs
  for insert to authenticated with check (has_role('master', 'activation_dept'));
create policy "activation role can update incident_logs" on incident_logs
  for update to authenticated using (has_role('master', 'activation_dept')) with check (has_role('master', 'activation_dept'));
create policy "master can delete incident_logs" on incident_logs
  for delete to authenticated using (is_master());
