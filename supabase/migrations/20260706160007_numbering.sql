-- Concurrency-safe document numbering. Replaces the source app's client-side
-- array.length counter, which breaks the moment two people use it at once.
create table numbering_sequences (
  scope text primary key,        -- e.g. 'customer', 'quote:20260706', 'invoice:2026-07'
  last_value int not null default 0
);

-- Atomic: the INSERT ... ON CONFLICT DO UPDATE is a single statement, so
-- Postgres serializes concurrent callers for the same scope internally —
-- no explicit row locking needed, and no transaction held open from the app.
create or replace function next_number(p_scope text)
returns int as $$
declare
  v_next int;
begin
  insert into numbering_sequences (scope, last_value)
  values (p_scope, 1)
  on conflict (scope) do update
    set last_value = numbering_sequences.last_value + 1
  returning last_value into v_next;
  return v_next;
end;
$$ language plpgsql security definer;

grant execute on function next_number(text) to authenticated;
