-- Self-service staff signup, gated behind master approval.
--
-- New column defaults to false so any future direct insert must explicitly
-- opt in to being pre-approved. Existing rows predate this feature and were
-- already vetted by a master provisioning them by hand, so they're
-- grandfathered in as approved.
alter table profiles add column is_approved boolean not null default false;
update profiles set is_approved = true where is_approved = false;

-- Organic signups (via the public /signup page) land as unapproved staff.
-- Master-provisioned accounts (via the admin staff API) pass
-- `pre_approved: true` in user_metadata to skip the approval queue.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'staff',
    coalesce((new.raw_user_meta_data ->> 'pre_approved')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- The RLS gate every operational table's policies funnel through — add the
-- approval requirement here so unapproved accounts can't read/write
-- anything beyond their own profile row, no matter how they connect.
create or replace function is_active_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_active = true and is_approved = true
  );
$$ language sql security definer stable;
