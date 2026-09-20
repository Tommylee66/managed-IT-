-- Retention periods, set by master, and the purge that enforces them.
--
-- UU PDP art. 43 requires personal data to go once its retention period
-- ends, but the periods themselves are a business and tax judgement, not
-- something to hardcode: they differ per category and will change as the
-- company's accountants and counsel settle them. So they live in a table a
-- master edits, and the purge reads that table rather than constants.
--
-- Every policy ships disabled. A retention purge is irreversible, and
-- enabling one before its period has been decided would delete data on a
-- placeholder number — so nothing runs until a master has looked at the
-- figure and switched it on deliberately.
--
-- Categories are a fixed set (the check constraint below), because each one
-- maps to specific SQL in purge_expired_personal_data(). A new category is a
-- migration, not a row someone inserts.

create table retention_policies (
  key varchar(40) primary key
    check (key in (
      'quotes_unconverted',
      'customer_contacts',
      'agent_records',
      'service_logs',
      'incident_logs',
      'audit_log'
    )),
  -- Months after the category's own anchor date (see the purge function:
  -- a quote's creation, a contract's termination, a log's own date).
  months integer not null check (months >= 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

-- Starting values, taken from the draft privacy policy. They are a starting
-- point for the decision, not the decision — hence enabled = false.
insert into retention_policies (key, months) values
  ('quotes_unconverted', 24),
  ('customer_contacts', 12),
  ('agent_records', 120),
  ('service_logs', 36),
  ('incident_logs', 36),
  ('audit_log', 36);

alter table retention_policies enable row level security;

-- Readable by any active staff member: the periods are part of the privacy
-- notice, not a secret. Only master changes them.
create policy "active staff can read retention_policies" on retention_policies
  for select to authenticated using (is_active_staff());
create policy "master can update retention_policies" on retention_policies
  for update to authenticated using (is_master()) with check (is_master());

-- What a purge would remove right now, per category. Master sees this
-- before running one — the operation cannot be undone, and a number that
-- looks wrong is the only warning anyone will get.
create or replace function preview_data_retention()
returns table (key varchar, months integer, enabled boolean, affected bigint) as $$
begin
  if not is_master() then
    raise exception 'Forbidden: master role required';
  end if;

  return query
  select p.key, p.months, p.enabled,
    case p.key
      when 'quotes_unconverted' then (
        select count(*) from quotes q
         where q.created_at < now() - make_interval(months => p.months)
           and not exists (select 1 from contracts c where c.quote_no = q.no)
      )
      when 'customer_contacts' then (
        select count(*) from customers cu
         where cu.contact is not null
           and not exists (
             select 1 from contracts c
              where c.customer_code = cu.code and c.status <> 'terminated')
           and coalesce(
                 (select max(t.term_date) from termination_plans t where t.customer_code = cu.code),
                 cu.created_at::date
               ) < (now() - make_interval(months => p.months))::date
      )
      when 'agent_records' then (
        select count(*) from agents a
         where a.name <> '(dihapus)'
           and not exists (
             select 1 from contracts c
              where c.agent_code = a.code and c.status <> 'terminated')
           and a.updated_at < now() - make_interval(months => p.months)
      )
      when 'service_logs' then (
        select count(*) from service_logs sl
         where sl.date < (now() - make_interval(months => p.months))::date
      )
      when 'incident_logs' then (
        select count(*) from incident_logs il
         where il.occurred_date < (now() - make_interval(months => p.months))::date
      )
      when 'audit_log' then (
        select count(*) from audit_log al
         where al.created_at < now() - make_interval(months => p.months)
      )
    end as affected
  from retention_policies p
  order by p.key;
end;
$$ language plpgsql security definer;

-- Applies every ENABLED policy. Returns what it removed, per category, and
-- writes one audit row for the run.
--
-- Contracts, quotes that became contracts, and invoices are deliberately
-- absent: they are tax evidence with their own statutory retention, and the
-- personal data on them is dealt with by anonymising the customer or agent
-- they point at (see 20260920000002), not by deleting the document.
create or replace function purge_expired_personal_data()
returns jsonb as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_policy record;
  v_count bigint;
begin
  if not is_master() then
    raise exception 'Forbidden: master role required';
  end if;

  for v_policy in select * from retention_policies where enabled loop
    v_count := 0;

    if v_policy.key = 'quotes_unconverted' then
      with deleted as (
        delete from quotes q
         where q.created_at < now() - make_interval(months => v_policy.months)
           and not exists (select 1 from contracts c where c.quote_no = q.no)
        returning 1
      ) select count(*) into v_count from deleted;

    elsif v_policy.key = 'customer_contacts' then
      with cleared as (
        update customers cu
           set contact = null, phone = null, email = null,
               invoice_email = null, address = null, memo = null,
               updated_at = now()
         where cu.contact is not null
           and not exists (
             select 1 from contracts c
              where c.customer_code = cu.code and c.status <> 'terminated')
           and coalesce(
                 (select max(t.term_date) from termination_plans t where t.customer_code = cu.code),
                 cu.created_at::date
               ) < (now() - make_interval(months => v_policy.months))::date
        returning 1
      ) select count(*) into v_count from cleared;

    elsif v_policy.key = 'agent_records' then
      with cleared as (
        update agents a
           set name = '(dihapus)', phone = null, email = null, address = null,
               memo = null, npwp = null, ktp = null, bank = null,
               active = false, updated_at = now()
         where a.name <> '(dihapus)'
           and not exists (
             select 1 from contracts c
              where c.agent_code = a.code and c.status <> 'terminated')
           and a.updated_at < now() - make_interval(months => v_policy.months)
        returning 1
      ) select count(*) into v_count from cleared;

    elsif v_policy.key = 'service_logs' then
      with deleted as (
        delete from service_logs sl
         where sl.date < (now() - make_interval(months => v_policy.months))::date
        returning 1
      ) select count(*) into v_count from deleted;

    elsif v_policy.key = 'incident_logs' then
      with deleted as (
        delete from incident_logs il
         where il.occurred_date < (now() - make_interval(months => v_policy.months))::date
        returning 1
      ) select count(*) into v_count from deleted;

    elsif v_policy.key = 'audit_log' then
      with deleted as (
        delete from audit_log al
         where al.created_at < now() - make_interval(months => v_policy.months)
        returning 1
      ) select count(*) into v_count from deleted;
    end if;

    v_result := v_result || jsonb_build_object(v_policy.key, v_count);
  end loop;

  -- Written last so the run's own row is never inside the audit_log sweep
  -- it just performed.
  perform log_audit('RETENTION_PURGE_RUN', null, null, v_result);

  return v_result;
end;
$$ language plpgsql security definer;

grant execute on function preview_data_retention() to authenticated;
grant execute on function purge_expired_personal_data() to authenticated;
