-- Scope a `sales_agent`-role login to a single business-partner agent.
--
-- Until now, `sales_agent` was already a restricted-menu role (see
-- ROLE_PATHS in src/lib/auth/permissions.ts: dashboard/customers/quotes/
-- contracts/change-requests only), but RLS treated it the same as any
-- other active staff member — full read/write on every customer, quote,
-- contract, and change request in the system, from every agent. This
-- links a `sales_agent` profile to a specific `agents.code` and scopes
-- exactly those four tables (the role's entire reachable surface) to
-- rows belonging to that agent.

alter table profiles add column agent_code varchar(10) references agents(code);
create index profiles_agent_code_idx on profiles(agent_code);

-- change_requests never carried its own agent_code (it only references
-- customer_code/contract_no) — add it so it can be scoped like the other
-- three tables, and backfill from the parent contract.
alter table change_requests add column agent_code varchar(10) references agents(code);
update change_requests cr
  set agent_code = c.agent_code
  from contracts c
  where c.no = cr.contract_no and cr.agent_code is null;

-- Returns the calling user's linked agent_code (null if unset, or if the
-- caller isn't a sales_agent at all — scoping only ever consults this for
-- that role). Mirrors the has_role()/is_active_staff() security-definer
-- helper pattern already used for RLS in this project.
create or replace function current_agent_code()
returns varchar(10) as $$
  select agent_code from profiles where id = auth.uid();
$$ language sql security definer stable;

-- customers/quotes/contracts/change_requests: replace the generic "any
-- active staff" policies from 20260706160009_rls_policies.sql with a
-- version that additionally scopes sales_agent rows to their own linked
-- agent_code. Every other role's access is unchanged. A sales_agent with
-- no linked agent_code yet matches nothing (NULL = NULL is never true) —
-- the agreed-on safe default until master links their account.
do $$
declare
  t text;
begin
  foreach t in array array['customers', 'quotes', 'contracts', 'change_requests']
  loop
    execute format('drop policy "active staff can read %1$I" on %1$I', t);
    execute format('drop policy "active staff can insert %1$I" on %1$I', t);
    execute format('drop policy "active staff can update %1$I" on %1$I', t);

    execute format(
      'create policy "scoped staff can read %1$I" on %1$I for select to authenticated using (is_active_staff() and (not has_role(''sales_agent'') or agent_code = current_agent_code()))',
      t
    );
    execute format(
      'create policy "scoped staff can insert %1$I" on %1$I for insert to authenticated with check (is_active_staff() and (not has_role(''sales_agent'') or agent_code = current_agent_code()))',
      t
    );
    execute format(
      'create policy "scoped staff can update %1$I" on %1$I for update to authenticated using (is_active_staff() and (not has_role(''sales_agent'') or agent_code = current_agent_code())) with check (is_active_staff() and (not has_role(''sales_agent'') or agent_code = current_agent_code()))',
      t
    );
  end loop;
end $$;
