-- agents (sales reps) — created before customers, which reference agents.code
create table agents (
  id uuid primary key default gen_random_uuid(),
  code varchar(10) not null unique,          -- AGT###
  name varchar(255) not null,
  rate numeric(5,2) not null,                -- commission %
  first_date date,
  change_date date,
  phone varchar(50),
  bank jsonb,                                -- account holder/number/bank name — sensitive
  memo text,
  active boolean not null default true,
  history jsonb not null default '[]',       -- append-only rate-change log
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agents_updated_at
  before update on agents
  for each row execute function update_updated_at_column();

-- customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  code varchar(10) not null unique,          -- CUS###
  name varchar(255) not null,
  tax_id varchar(50),                        -- NPWP/NIB — sensitive
  contact varchar(255),
  phone varchar(50),                         -- sensitive
  email varchar(255),                        -- sensitive
  invoice_email varchar(255),                -- sensitive
  address text,
  memo text,
  status customer_status not null default 'draft',
  contract_no varchar(30),
  agent_code varchar(10) references agents(code),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_agent on customers(agent_code);
create index idx_customers_status on customers(status);

create trigger set_customers_updated_at
  before update on customers
  for each row execute function update_updated_at_column();

-- rates: singleton config row (pricing, cost basis, commission rules)
create table rates (
  id int primary key default 1 check (id = 1),
  base_monthly numeric(15,2) not null default 0,
  contract24_addon numeric(15,2) not null default 0,
  employee_unit numeric(15,2) not null default 0,
  ap_unit numeric(15,2) not null default 0,
  hub_unit numeric(15,2) not null default 0,
  cctv_block numeric(15,2) not null default 0,
  visit2_addon numeric(15,2) not null default 0,
  priority numeric(15,2) not null default 0,
  vpn_base numeric(15,2) not null default 0,
  vpn_branch numeric(15,2) not null default 0,
  security_monitor numeric(15,2) not null default 0,
  security_device numeric(15,2) not null default 0,
  ppn numeric(5,2) not null default 11,
  cost_fields jsonb not null default '{}',      -- internal cost basis — sensitive, master-only
  init_fields jsonb not null default '{}',      -- one-time equipment costs — sensitive
  locations jsonb not null default '[]',        -- [{name, fee, cost}]
  commission_items jsonb not null default '{}', -- which line items count toward commission
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

insert into rates (id) values (1);

create trigger set_rates_updated_at
  before update on rates
  for each row execute function update_updated_at_column();
