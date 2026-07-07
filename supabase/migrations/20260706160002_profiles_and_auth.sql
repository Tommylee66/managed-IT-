-- profiles: extends auth.users with role + active flag. One row per staff member.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(255) not null,
  role staff_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- Auto-create a profile row whenever a new auth.users row is created.
-- New accounts default to 'staff'; promotion to 'master' is a deliberate
-- manual step (SQL or the admin UI), never automatic.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'staff'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Role helper functions, used throughout RLS policies (20260706160009).
create or replace function get_user_role()
returns staff_role as $$
  select role from profiles where id = auth.uid() and is_active = true limit 1;
$$ language sql security definer stable;

create or replace function is_master()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'master' and is_active = true
  );
$$ language sql security definer stable;

create or replace function is_active_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_active = true
  );
$$ language sql security definer stable;
