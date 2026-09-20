-- Purge a customer's service credentials once their last contract ends.
--
-- service_credentials holds the customer's OWN system logins (cloud storage,
-- hosting, device access), kept only so BCT can operate their infrastructure
-- under contract. When no contract is in force there is no longer a basis to
-- hold them, and of everything in this database they are the most damaging
-- thing to leak — a stale row is a live credential into someone else's
-- network long after the relationship ended.
--
-- Why a function instead of a delete in the app: deleting these rows is
-- master-only (see 20260728000002), but /termination is reachable by
-- admin_dept too. A plain delete from the app would silently remove zero
-- rows for an admin_dept user, because RLS filters a DELETE rather than
-- failing it — the worst kind of bug, since the cleanup would appear to work.
-- This runs security definer so the purge is a system action, independent of
-- who happened to terminate the contract.
--
-- The row is keyed by customer, not contract, so the guard below matters: a
-- customer with two contracts who terminates one keeps their credentials.
create or replace function purge_customer_credentials(p_customer_code varchar)
returns integer as $$
declare
  v_remaining integer;
  v_deleted integer;
begin
  -- Same roles that can reach /termination (see ROLE_PATHS in
  -- src/lib/auth/permissions.ts). Without this, any authenticated user could
  -- call the RPC directly and destroy data.
  if not has_role('master', 'admin_dept') then
    raise exception 'Forbidden: master or admin_dept role required';
  end if;

  select count(*) into v_remaining
    from contracts
   where customer_code = p_customer_code
     and status <> 'terminated';

  if v_remaining > 0 then
    return 0;
  end if;

  with deleted as (
    delete from service_credentials
     where customer_code = p_customer_code
    returning 1
  )
  select count(*) into v_deleted from deleted;

  -- Deliberately audited: this is an irreversible deletion of data someone
  -- may later ask about, and it happens as a side effect of terminating a
  -- contract rather than as an explicit user action.
  if v_deleted > 0 then
    perform log_audit(
      'SERVICE_CREDENTIALS_PURGED',
      'service_credentials',
      p_customer_code,
      jsonb_build_object('deleted', v_deleted)
    );
  end if;

  return v_deleted;
end;
$$ language plpgsql security definer;

grant execute on function purge_customer_credentials(varchar) to authenticated;
