-- Erasure of personal data, as anonymisation rather than deletion.
--
-- UU PDP art. 43 requires personal data to go once its purpose is served,
-- but the rows holding it are also tax evidence: an agent's code is on
-- contracts, quotes and invoices that have to survive for years, and
-- customers(code) is referenced by fourteen other tables. Deleting the row
-- would either fail on the foreign keys or take the books with it.
--
-- So the identifying fields are cleared and the business record stays. What
-- remains (a code, amounts, dates) no longer identifies a person, which is
-- the point: anonymised data is outside the law's scope, so this satisfies
-- the erasure right and the retention duty at the same time.
--
-- Not reversible. Both functions refuse while a contract is still running,
-- because the relationship that justifies holding the data has not ended.

create or replace function anonymize_agent(p_code varchar)
returns void as $$
declare
  v_active integer;
begin
  if not is_master() then
    raise exception 'Forbidden: master role required';
  end if;

  select count(*) into v_active
    from contracts
   where agent_code = p_code
     and status <> 'terminated';

  if v_active > 0 then
    raise exception 'Agent % still has % contract(s) in force', p_code, v_active;
  end if;

  -- name is kept as a placeholder rather than nulled: it is `not null`, and
  -- every document that ever cited this agent reads better with a marker
  -- than with an empty cell.
  --
  -- rate and history stay. They are the basis of commission already paid and
  -- belong to the payout evidence, not to the person — and on their own they
  -- identify nobody once the name and account are gone.
  update agents
     set name = '(dihapus)',
         phone = null,
         email = null,
         address = null,
         memo = null,
         npwp = null,
         ktp = null,
         bank = null,
         active = false,
         updated_at = now()
   where code = p_code;

  if not found then
    raise exception 'Agent % not found', p_code;
  end if;

  -- Unlink any staff login scoped to this agent, or it would keep matching
  -- rows through current_agent_code() with nobody behind it.
  update profiles set agent_code = null where agent_code = p_code;

  perform log_audit('AGENT_ANONYMIZED', 'agents', p_code, '{}'::jsonb);
end;
$$ language plpgsql security definer;

create or replace function anonymize_customer(p_code varchar)
returns void as $$
declare
  v_active integer;
begin
  if not is_master() then
    raise exception 'Forbidden: master role required';
  end if;

  select count(*) into v_active
    from contracts
   where customer_code = p_code
     and status <> 'terminated';

  if v_active > 0 then
    raise exception 'Customer % still has % contract(s) in force', p_code, v_active;
  end if;

  -- The customer is a company, so `name` and `tax_id` are not personal data
  -- and stay on the record — the tax documents naming them have to remain
  -- readable. Only the individual contact behind the company goes.
  update customers
     set contact = null,
         phone = null,
         email = null,
         invoice_email = null,
         address = null,
         memo = null,
         updated_at = now()
   where code = p_code;

  if not found then
    raise exception 'Customer % not found', p_code;
  end if;

  -- Their staff's names and extensions have no basis to remain either.
  delete from ip_phone_extensions where customer_code = p_code;
  delete from service_credentials where customer_code = p_code;

  perform log_audit('CUSTOMER_ANONYMIZED', 'customers', p_code, '{}'::jsonb);
end;
$$ language plpgsql security definer;

grant execute on function anonymize_agent(varchar) to authenticated;
grant execute on function anonymize_customer(varchar) to authenticated;
