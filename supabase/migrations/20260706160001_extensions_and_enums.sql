-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type staff_role as enum ('master', 'staff');

create type customer_status as enum ('draft', 'contracted', 'activated');

create type contract_status as enum ('contracted', 'activated', 'terminated');

create type application_status as enum (
  'received', 'quote_ready', 'agreed', 'contract_ready', 'open_pending'
);

create type activation_status as enum ('activated', 'pending', 'issue');

create type asset_type as enum (
  'router', 'ap', 'hub_switch', 'cctv', 'security', 'vpn_config',
  'starlink', 'pc_server', 'printer', 'other'
);

create type asset_owner as enum ('bct', 'customer');

create type asset_condition as enum (
  'installed', 'pending', 'spare', 'customer_owned', 'faulty', 'returned', 'removed'
);

create type asset_action as enum ('collect', 'leave_bill', 'close_config', 'remain_customer');

-- Matches the source app's service log activity types verbatim (Korean labels
-- are the business vocabulary staff already use — no translation layer).
create type service_log_type as enum (
  '계약확정', '개통', '자산', '서비스 이력', '장애대응', '정기점검',
  '자산변경', '장비교체', '설정변경', '요금변경', '서비스 추가', '서비스 삭제',
  '고객요청', '견적합의', '신규신청', '중도해지 안내', '청구서이메일발송', '기타'
);

-- Shared trigger to keep updated_at current on any UPDATE
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
