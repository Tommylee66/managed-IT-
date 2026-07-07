-- activations
create table activations (
  id varchar(30) primary key,                -- ACT+timestamp, generated server-side
  contract_no varchar(20) not null references contracts(no),
  date date not null,
  billing_date date,
  engineer varchar(255),
  site varchar(255),
  customer_pic varchar(255),
  confirm_type varchar(50),
  security_summary text,
  status activation_status not null default 'pending',
  notes text,
  asset_summary jsonb,
  saved_by uuid references profiles(id),
  saved_at timestamptz not null default now()
);

create index idx_activations_contract on activations(contract_no);

-- assets (normalized out of the source app's embedded activation.assets[])
create table assets (
  id uuid primary key default gen_random_uuid(),
  asset_id varchar(15) not null unique,      -- AST#####
  activation_id varchar(30) references activations(id),
  contract_no varchar(20) references contracts(no),
  customer_code varchar(10) references customers(code),
  customer_name varchar(255),
  type asset_type not null,
  owner asset_owner not null,
  name varchar(255),
  model varchar(255),
  serial text,                               -- multi-line, may include MAC/IP — sensitive
  qty int not null default 1,
  location varchar(255),
  condition asset_condition not null default 'pending',
  warranty varchar(100),
  notes text,
  source varchar(100),
  status varchar(50),
  registered_by uuid references profiles(id),
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assets_contract on assets(contract_no);
create index idx_assets_customer on assets(customer_code);
create index idx_assets_activation on assets(activation_id);

create trigger set_assets_updated_at
  before update on assets
  for each row execute function update_updated_at_column();

-- asset_history: audit trail of asset changes over time
create table asset_history (
  id varchar(30) primary key,                -- AH+timestamp
  contract_no varchar(20) references contracts(no),
  customer_code varchar(10) references customers(code),
  type varchar(100),
  date date not null,
  summary text,
  activation_id varchar(30) references activations(id),
  items jsonb not null default '[]',         -- asset snapshots at time of change
  saved_by uuid references profiles(id),
  saved_at timestamptz not null default now()
);

create index idx_asset_history_contract on asset_history(contract_no);

-- service_logs: customer service/activity timeline
create table service_logs (
  id varchar(30) primary key,                -- LOG+timestamp
  customer_code varchar(10) not null references customers(code),
  date date not null,
  type service_log_type not null,
  title varchar(255),
  memo text,
  saved_by uuid references profiles(id),
  saved_at timestamptz not null default now()
);

create index idx_service_logs_customer on service_logs(customer_code);
