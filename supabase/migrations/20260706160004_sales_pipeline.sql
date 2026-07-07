-- quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  no varchar(20) not null unique,            -- QUO+YYYYMMDD-###
  customer_code varchar(10) not null references customers(code),
  agent_code varchar(10) references agents(code),
  start_date date,
  billing_date date,
  months int not null,
  inputs jsonb not null default '{}',        -- {emp,ap,hub,cctv,visit,locationIndex,vpn,vpnBranches,security,priority,discount,memo}
  rows jsonb not null default '[]',          -- [{key,label,amount,cost,init,commissionable}]
  monthly numeric(15,2) not null,
  monthly_cost numeric(15,2) not null,       -- sensitive
  init_cost numeric(15,2) not null,          -- sensitive
  amort numeric(15,2) not null,              -- sensitive
  total_cost numeric(15,2) not null,         -- sensitive
  margin numeric(6,2) not null,              -- sensitive — internal margin %
  commission_base numeric(15,2) not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_quotes_customer on quotes(customer_code);

-- contracts
create table contracts (
  id uuid primary key default gen_random_uuid(),
  no varchar(20) not null unique,            -- CTR+YYYYMMDD-###
  quote_no varchar(20) references quotes(no),
  customer_code varchar(10) not null references customers(code),
  customer_name varchar(255) not null,       -- denormalized snapshot at contract time
  agent_code varchar(10) references agents(code),
  agent_name varchar(255),
  start_date date not null,
  billing_date date,
  end_date date,
  months int not null,
  monthly_fee numeric(15,2) not null,
  commission_base numeric(15,2) not null,
  commission_rate numeric(5,2) not null,
  monthly_commission numeric(15,2) not null,      -- sensitive/high
  half_monthly_commission numeric(15,2) not null, -- sensitive/high
  commission_full_end date,
  commission_half_start date,
  commission_end date,
  total_commission numeric(15,2) not null,        -- sensitive/high
  quote_snapshot jsonb not null,
  status contract_status not null default 'contracted',
  activation_date date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contracts_customer on contracts(customer_code);
create index idx_contracts_agent on contracts(agent_code);
create index idx_contracts_status on contracts(status);

create trigger set_contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at_column();

-- applications (pre-quote/contract intake)
create table applications (
  id uuid primary key default gen_random_uuid(),
  no varchar(20) not null unique,            -- APP+YYYYMMDD-###
  date date not null,
  source varchar(100),
  status application_status not null default 'received',
  customer_code varchar(10) references customers(code),
  customer_name varchar(255),
  agent_code varchar(10) references agents(code),
  start_date date,
  months int,
  billing_date date,
  inputs jsonb not null default '{}',
  monthly numeric(15,2),
  calc jsonb,
  quote_no varchar(20) references quotes(no),
  contract_no varchar(20) references contracts(no),
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_applications_customer on applications(customer_code);
create index idx_applications_status on applications(status);
