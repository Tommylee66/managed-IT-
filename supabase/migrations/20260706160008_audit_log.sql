-- Insert-only audit trail for admin actions (password resets, account
-- create/deactivate, rate changes). No UPDATE/DELETE policy — permanent record.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  actor_role staff_role,
  action varchar(100) not null,              -- e.g. 'PASSWORD_RESET', 'STAFF_DEACTIVATED'
  target_table varchar(100),
  target_id varchar(100),
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_log_created_at on audit_log(created_at desc);

-- Only this function may insert audit rows — never a direct client INSERT,
-- so the log can't be tampered with even by a compromised staff session.
create or replace function log_audit(
  p_action varchar,
  p_target_table varchar default null,
  p_target_id varchar default null,
  p_details jsonb default '{}'
)
returns void as $$
begin
  insert into audit_log (actor_id, actor_role, action, target_table, target_id, details)
  values (auth.uid(), get_user_role(), p_action, p_target_table, p_target_id, p_details);
end;
$$ language plpgsql security definer;

grant execute on function log_audit(varchar, varchar, varchar, jsonb) to authenticated;
