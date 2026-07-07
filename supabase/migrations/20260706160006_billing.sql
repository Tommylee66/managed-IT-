-- invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  no varchar(20) not null unique,            -- monthly sequence, e.g. INV2026-07-001
  customer_code varchar(10) not null references customers(code),
  customer_name varchar(255),
  contract_no varchar(20) references contracts(no),
  month varchar(7) not null,                 -- YYYY-MM
  date date not null,
  due_date date,
  recipient_email varchar(255),              -- sensitive
  items jsonb not null default '[]',         -- [{label, amount}]
  subtotal numeric(15,2) not null,
  ppn numeric(15,2) not null,
  total numeric(15,2) not null,
  memo text,
  sent_at timestamptz,
  sent_to varchar(255),
  send_method varchar(50),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_contract_month unique (contract_no, month)
);

create index idx_invoices_customer on invoices(customer_code);
create index idx_invoices_month on invoices(month);

create trigger set_invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at_column();

-- change_requests: mid-contract service/pricing adjustments
create table change_requests (
  id uuid primary key default gen_random_uuid(),
  no varchar(20) not null unique,            -- CHG+YYYYMMDD-###
  date date not null,
  effective_date date,
  type varchar(100),
  customer_code varchar(10) references customers(code),
  customer_name varchar(255),
  contract_no varchar(20) references contracts(no),
  old_monthly numeric(15,2),
  new_monthly numeric(15,2),
  diff numeric(15,2),
  old_inputs jsonb,
  new_inputs jsonb,
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_change_requests_contract on change_requests(contract_no);

-- termination_plans
create table termination_plans (
  id varchar(30) primary key,                -- TRP+timestamp
  contract_no varchar(20) not null references contracts(no),
  customer_code varchar(10) references customers(code),
  customer_name varchar(255),
  term_date date not null,
  remaining int,
  penalty_rate numeric(5,2) not null default 50,
  admin_fee numeric(15,2) not null default 0,
  unpaid numeric(15,2) not null default 0,
  memo text,
  -- each item: {key, assetId, type, owner, name, model, serial, qty, location,
  --             action, originalCost, unamortized}  -- unamortized is sensitive
  asset_decisions jsonb not null default '[]',
  saved_by uuid references profiles(id),
  saved_at timestamptz not null default now()
);

create index idx_termination_plans_contract on termination_plans(contract_no);
