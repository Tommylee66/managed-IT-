-- Two new record types living under the Activations feature, per-customer:
-- (1) IP phone extension assignments — staff now hand employees a SIP
--     softphone app instead of a hardware IP phone, so there's no physical
--     device to register as an asset; this tracks who has which extension.
-- (2) Service credentials (cloud storage, web hosting, device admin logins,
--     etc.) set up during activation. Passwords are encrypted at the
--     application layer (AES-256-GCM, key in CREDENTIAL_ENCRYPTION_KEY env
--     var — never stored in Postgres) before being written here, so a
--     database-level leak alone does not expose plaintext passwords.
--
-- Both tables are restricted to master/activation_dept, matching the
-- `activations` table's own RLS — these are only ever surfaced on the
-- activation detail page, which route-level access control (canAccessPath)
-- already limits to those two roles.

create table ip_phone_extensions (
  id uuid primary key default gen_random_uuid(),
  customer_code varchar(10) not null references customers(code),
  employee_name text not null,
  extension_number text not null,
  device_type text not null default 'sip_app' check (device_type in ('sip_app', 'hardware_phone')),
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ip_phone_extensions_customer on ip_phone_extensions(customer_code);

create trigger set_ip_phone_extensions_updated_at
  before update on ip_phone_extensions
  for each row execute function update_updated_at_column();

alter table ip_phone_extensions enable row level security;

create policy "activation role can read ip_phone_extensions" on ip_phone_extensions
  for select to authenticated using (has_role('master', 'activation_dept'));
create policy "activation role can insert ip_phone_extensions" on ip_phone_extensions
  for insert to authenticated with check (has_role('master', 'activation_dept'));
create policy "activation role can update ip_phone_extensions" on ip_phone_extensions
  for update to authenticated using (has_role('master', 'activation_dept')) with check (has_role('master', 'activation_dept'));
create policy "master can delete ip_phone_extensions" on ip_phone_extensions
  for delete to authenticated using (is_master());

create table service_credentials (
  id uuid primary key default gen_random_uuid(),
  customer_code varchar(10) not null references customers(code),
  service_name text not null,
  category text not null default 'other' check (category in ('cloud_storage', 'web_hosting', 'device_access', 'other')),
  login_id text,
  -- {iv, authTag, ciphertext} from src/lib/crypto/credential-encryption.ts, or null if no password is on file.
  password_encrypted jsonb,
  url text,
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_service_credentials_customer on service_credentials(customer_code);

create trigger set_service_credentials_updated_at
  before update on service_credentials
  for each row execute function update_updated_at_column();

alter table service_credentials enable row level security;

create policy "activation role can read service_credentials" on service_credentials
  for select to authenticated using (has_role('master', 'activation_dept'));
create policy "activation role can insert service_credentials" on service_credentials
  for insert to authenticated with check (has_role('master', 'activation_dept'));
create policy "activation role can update service_credentials" on service_credentials
  for update to authenticated using (has_role('master', 'activation_dept')) with check (has_role('master', 'activation_dept'));
create policy "master can delete service_credentials" on service_credentials
  for delete to authenticated using (is_master());
