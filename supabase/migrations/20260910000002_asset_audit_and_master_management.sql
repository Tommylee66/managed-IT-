-- Preserve an immutable before/after record for every asset change. The
-- trigger is database-level so changes made by activation workflows or
-- future admin screens cannot bypass the audit trail.
create or replace function public.audit_asset_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action varchar(100);
begin
  if tg_op = 'UPDATE' and new is not distinct from old then
    return new;
  end if;

  v_action := case tg_op
    when 'INSERT' then 'ASSET_CREATED'
    when 'UPDATE' then 'ASSET_UPDATED'
    when 'DELETE' then 'ASSET_DELETED'
  end;

  insert into public.audit_log (
    actor_id,
    actor_role,
    action,
    target_table,
    target_id,
    details
  )
  values (
    auth.uid(),
    public.get_user_role(),
    v_action,
    'assets',
    case when tg_op = 'DELETE' then old.asset_id else new.asset_id end,
    jsonb_build_object(
      'before', case when tg_op = 'INSERT' then null else to_jsonb(old) end,
      'after', case when tg_op = 'DELETE' then null else to_jsonb(new) end
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_asset_changes on public.assets;
create trigger audit_asset_changes
  after insert or update or delete on public.assets
  for each row execute function public.audit_asset_change();
