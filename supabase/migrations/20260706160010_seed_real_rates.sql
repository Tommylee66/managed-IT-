-- Seeds the actual production pricing config (from BCT's live source-app
-- backup, bct_managed_it_backup_2026-07-06.json), replacing the all-zero
-- defaults inserted by 20260706160003_core_tables.sql.
update rates set
  base_monthly = 4900000,
  contract24_addon = 1000000,
  employee_unit = 75000,
  ap_unit = 350000,
  hub_unit = 250000,
  cctv_block = 350000,
  visit2_addon = 800000,
  priority = 1500000,
  vpn_base = 1500000,
  vpn_branch = 500000,
  security_monitor = 1200000,
  security_device = 2500000,
  ppn = 11,
  cost_fields = '{
    "costRemote": 500000, "costVisit": 850000, "costReserve": 350000,
    "costEmp": 30000, "costAp": 25000, "costHub": 15000, "costCctv": 15000,
    "costVpnBase": 500000, "costVpnBranch": 150000,
    "costSecMonitor": 400000, "costSecDevice": 600000
  }'::jsonb,
  init_fields = '{
    "initRouter": 2200000, "initAp": 1800000, "initHub": 1400000,
    "initSetup": 3500000, "initLan": 2500000, "initSecurityDevice": 12000000
  }'::jsonb,
  locations = '[
    {"name": "Jakarta / Tangerang / Bekasi / Depok", "fee": 0, "cost": 0},
    {"name": "Cikarang / Karawang / Bogor 외곽", "fee": 750000, "cost": 500000},
    {"name": "Purwakarta / Subang / Serang", "fee": 1800000, "cost": 1200000}
  ]'::jsonb,
  commission_items = '{
    "base": true, "term": true, "employee": true, "ap": true, "hub": true,
    "cctv": true, "visit": true, "location": true, "priority": true,
    "vpn": true, "security": true, "discount": false
  }'::jsonb
where id = 1;
