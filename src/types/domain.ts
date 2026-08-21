// Hand-written types mirroring supabase/migrations/*.sql exactly (Postgres
// container tooling for `supabase gen types` isn't available in this dev
// environment — no Docker/podman — so these are maintained by hand whenever
// the schema changes).

/** master: full access (max 2 accounts, enforced in the staff-creation API).
 * admin_dept: everything except rates/activations/incident-logs.
 * activation_dept: customer lookup + activations + incident-logs only.
 * sales_agent: customer/quote/contract/change-request only. */
export type StaffRole = 'master' | 'admin_dept' | 'activation_dept' | 'sales_agent';
export type CustomerStatus = 'draft' | 'contracted' | 'activated';
export type ContractStatus = 'contracted' | 'activated' | 'terminated';
export type ApplicationStatus =
  | 'received'
  | 'quote_ready'
  | 'agreed'
  | 'contract_ready'
  | 'open_pending';
export type ActivationStatus = 'activated' | 'pending' | 'issue';
export type AssetType =
  | 'router'
  | 'ap'
  | 'hub_switch'
  | 'cctv'
  | 'security'
  | 'vpn_config'
  | 'starlink'
  | 'pc_server'
  | 'printer'
  | 'ip_pbx'
  | 'other';
export type AssetOwner = 'bct' | 'customer';
export type AssetCondition =
  | 'installed'
  | 'pending'
  | 'spare'
  | 'customer_owned'
  | 'faulty'
  | 'returned'
  | 'removed';
export type AssetAction = 'collect' | 'leave_bill' | 'close_config' | 'remain_customer';

export interface Profile {
  id: string;
  full_name: string;
  role: StaffRole;
  is_active: boolean;
  is_approved: boolean;
  /** For role === 'sales_agent': the agents.code this login is scoped to.
   * Null means unlinked — the account sees no customers/quotes/contracts/
   * change-requests until master links it (see current_agent_code() RLS). */
  agent_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRateHistoryEntry {
  date: string;
  rate: number;
  recordedAt: string;
}

export interface AgentBank {
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
}

export interface Agent {
  id: string;
  code: string;
  name: string;
  rate: number;
  first_date: string | null;
  change_date: string | null;
  phone: string | null;
  email: string | null;
  bank: AgentBank | null;
  /** Tax ID (Nomor Pokok Wajib Pajak) — needed to withhold and remit PPh on
   * commission payouts. Null for agents not yet registered for tax. */
  npwp: string | null;
  /** National ID (Kartu Tanda Penduduk) — fallback identifier for
   * individuals without an NPWP, still required for tax paperwork. */
  ktp: string | null;
  address: string | null;
  memo: string | null;
  active: boolean;
  history: AgentRateHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  tax_id: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  invoice_email: string | null;
  address: string | null;
  memo: string | null;
  status: CustomerStatus;
  contract_no: string | null;
  agent_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RateLocation {
  name: string;
  fee: number;
  cost: number;
}

export interface RatesCostFields {
  costRemote: number;
  costVisit: number;
  costReserve: number;
  costEmp: number;
  costAp: number;
  costHub: number;
  costCctv: number;
  costVpnBase: number;
  costVpnBranch: number;
  costSecMonitor: number;
  costSecDevice: number;
}

export interface RatesInitFields {
  initRouter: number;
  initAp: number;
  initHub: number;
  initSetup: number;
  initLan: number;
  initSecurityDevice: number;
}

export interface RatesCommissionItems {
  base: boolean;
  term: boolean;
  employee: boolean;
  ap: boolean;
  hub: boolean;
  cctv: boolean;
  visit: boolean;
  location: boolean;
  vpn: boolean;
  security: boolean;
  discount: boolean;
}

export interface Rates {
  id: 1;
  base_monthly: number;
  contract24_addon: number;
  employee_unit: number;
  ap_unit: number;
  hub_unit: number;
  cctv_block: number;
  visit2_addon: number;
  vpn_base: number;
  vpn_branch: number;
  security_monitor: number;
  security_device: number;
  ppn: number;
  employee_base_count: number;
  cctv_base_count: number;
  cost_fields: RatesCostFields;
  init_fields: RatesInitFields;
  locations: RateLocation[];
  commission_items: RatesCommissionItems;
  updated_by: string | null;
  updated_at: string;
}

export interface QuoteInputs {
  emp: number;
  ap: number;
  hub: number;
  cctv: number;
  visit: 1 | 2;
  locationIndex: number;
  vpn: 'none' | 'base';
  vpnBranches: number;
  security: 'none' | 'monitor' | 'device';
  discount: number;
  /** How many months from contract start the discount applies for — 0 means
   * unlimited (applies for the life of the contract, the old behavior).
   * After this many months, monthly invoicing drops the discount row and
   * bills at full price. */
  discountMonths: number;
  memo: string;
}

export interface EquipmentCatalogItem {
  id: string;
  category: AssetType;
  model_name: string;
  spec_id: string | null;
  spec_ko: string | null;
  /** One-time acquisition cost, master-only — used only to suggest
   * monthly_rate/monthly_cost in the admin UI, not stored anywhere else. */
  purchase_price: number | null;
  /** Monthly rental rate charged to the customer. Null = spec-only
   * reference item (not a billable line, e.g. an AP model just documented
   * for the quote's equipment table). */
  monthly_rate: number | null;
  /** Internal monthly cost, master-only — null if not tracked. */
  monthly_cost: number | null;
  /** Usage-based overage: customer price per extra unit beyond the flat
   * monthly rate (e.g. per extra printed page). Null = no overage tier. */
  overage_rate: number | null;
  /** Internal cost per extra unit, master-only. */
  overage_cost: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Snapshot of a chosen catalog item, stored on the quote itself — see the
 * comment in supabase/migrations/20260709000001_equipment_catalog.sql. */
export interface EquipmentSelection {
  catalogId: string;
  category: AssetType;
  modelName: string;
  specId: string | null;
  specKo: string | null;
  qty: number;
  /** Rate/cost snapshotted at selection time — see EquipmentCatalogItem. */
  monthlyRate: number | null;
  monthlyCost: number | null;
  /** Extra units used this period (e.g. pages printed beyond the base
   * rental) and the per-unit rate/cost snapshotted at selection time. */
  overageQty: number;
  overageRate: number | null;
  overageCost: number | null;
}

export interface ServiceCatalogItem {
  id: string;
  name_id: string;
  name_ko: string;
  description_id: string | null;
  description_ko: string | null;
  /** Monthly rate charged to the customer. Null = not yet priced. */
  monthly_rate: number | null;
  /** Internal monthly cost, master-only — null if not tracked. */
  monthly_cost: number | null;
  /** One-time construction/installation fee, customer-facing. Null = none. */
  one_time_fee: number | null;
  /** Internal cost of the one-time fee, master-only. */
  one_time_cost: number | null;
  /** How the one-time fee is collected: as a single lump sum, or spread
   * evenly across the contract's months. */
  one_time_billing_mode: 'one_time' | 'monthly';
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Snapshot of a chosen service catalog item, stored on the quote/change
 * request itself — see supabase/migrations/20260713000001_service_catalog.sql. */
export interface ServiceSelection {
  catalogId: string;
  nameId: string;
  nameKo: string;
  descriptionId: string | null;
  descriptionKo: string | null;
  qty: number;
  /** Rate/cost snapshotted at selection time — see ServiceCatalogItem. */
  monthlyRate: number | null;
  monthlyCost: number | null;
  oneTimeFee: number | null;
  oneTimeCost: number | null;
  oneTimeBillingMode: 'one_time' | 'monthly';
}

export interface QuoteRowRecord {
  key: string;
  label: string;
  /** Locale-aware rendering key into QUOTE_ROW_LABELS (src/lib/calc/quote-row-labels.ts).
   * Optional so older stored rows without it still fall back to `label` (Korean). */
  labelKey?: string;
  params?: Record<string, string | number>;
  /** Inline bilingual override for rows sourced from free-text catalog data
   * (e.g. a service catalog item's name) rather than a fixed QUOTE_ROW_LABELS
   * entry — takes precedence over labelKey when present. */
  labelId?: string;
  labelKo?: string;
  amount: number;
  cost: number;
  init: number;
  commissionable: boolean;
  /** Marks this row as a non-recurring one-time charge — excluded from the
   * quote/contract's recurring monthly/margin/commission figures, rendered
   * in its own section on the quote and contract documents instead. */
  oneTime?: boolean;
}

export interface Quote {
  id: string;
  no: string;
  customer_code: string;
  agent_code: string | null;
  start_date: string | null;
  billing_date: string | null;
  months: number;
  inputs: QuoteInputs;
  rows: QuoteRowRecord[];
  equipment_selections: EquipmentSelection[];
  service_selections: ServiceSelection[];
  monthly: number;
  monthly_cost: number;
  init_cost: number;
  amort: number;
  total_cost: number;
  margin: number;
  commission_base: number;
  created_by: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  no: string;
  quote_no: string | null;
  customer_code: string;
  customer_name: string;
  agent_code: string | null;
  agent_name: string | null;
  start_date: string;
  billing_date: string | null;
  end_date: string | null;
  months: number;
  monthly_fee: number;
  commission_base: number;
  commission_rate: number;
  monthly_commission: number;
  half_monthly_commission: number;
  commission_full_end: string | null;
  commission_half_start: string | null;
  commission_end: string | null;
  total_commission: number;
  quote_snapshot: Quote;
  status: ContractStatus;
  activation_date: string | null;
  /** Set when a master explicitly confirms this contract is real, finalized
   * business — null means "just created from a quote, not yet confirmed".
   * Independent of `status` (see confirmContract() in data-access/contracts.ts);
   * revenue-reporting reads (dashboard, commission reports) should filter on
   * this, but the operational lifecycle (activation/invoicing/termination)
   * intentionally does not. */
  confirmed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activation {
  id: string;
  contract_no: string;
  date: string;
  billing_date: string | null;
  engineer: string | null;
  site: string | null;
  customer_pic: string | null;
  confirm_type: string | null;
  security_summary: string | null;
  status: ActivationStatus;
  notes: string | null;
  asset_summary: string | null;
  saved_by: string | null;
  saved_at: string;
}

export interface Asset {
  id: string;
  asset_id: string;
  activation_id: string | null;
  contract_no: string | null;
  customer_code: string | null;
  customer_name: string | null;
  type: AssetType;
  owner: AssetOwner;
  name: string | null;
  model: string | null;
  serial: string | null;
  qty: number;
  location: string | null;
  condition: AssetCondition;
  warranty: string | null;
  notes: string | null;
  source: string | null;
  status: string | null;
  registered_by: string | null;
  registered_at: string;
  updated_at: string;
}

export type IpPhoneDeviceType = 'sip_app' | 'hardware_phone';

/** Employee-to-extension assignment for a customer's IP phone system —
 * separate from `assets` because a SIP softphone on someone's personal
 * smartphone isn't a physical device BCT provisions or tracks. */
export interface IpPhoneExtension {
  id: string;
  customer_code: string;
  employee_name: string;
  extension_number: string;
  device_type: IpPhoneDeviceType;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceCredentialCategory = 'cloud_storage' | 'web_hosting' | 'device_access' | 'other';

/** Login credentials for a third-party service set up during activation
 * (cloud storage, web hosting, device admin panels, etc.). The password is
 * never included here — list views only ever get `has_password`; the
 * plaintext is fetched on demand via a dedicated reveal action, gated to
 * master/activation_dept, and decrypted server-side only (see
 * src/lib/crypto/credential-encryption.ts). */
export interface ServiceCredential {
  id: string;
  customer_code: string;
  service_name: string;
  category: ServiceCredentialCategory;
  login_id: string | null;
  has_password: boolean;
  url: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetHistory {
  id: string;
  contract_no: string | null;
  customer_code: string | null;
  type: string;
  date: string;
  summary: string | null;
  activation_id: string | null;
  items: Asset[];
  saved_by: string | null;
  saved_at: string;
}

export type IncidentLogType = 'incident' | 'inspection';

/** 장애처리 및 정기점검 — structured (unlike the free-text ServiceLog) so a
 * month's records can be assembled into a customer-facing report. */
export interface IncidentLog {
  id: string;
  customer_code: string;
  type: IncidentLogType;
  occurred_date: string;
  title: string;
  description: string;
  resolution: string | null;
  engineer: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ServiceLog {
  id: string;
  customer_code: string;
  date: string;
  type: string;
  title: string | null;
  memo: string | null;
  saved_by: string | null;
  saved_at: string;
}

export interface InvoiceItem {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  no: string;
  customer_code: string;
  customer_name: string | null;
  contract_no: string | null;
  month: string;
  date: string;
  due_date: string | null;
  recipient_email: string | null;
  items: InvoiceItem[];
  subtotal: number;
  ppn: number;
  total: number;
  memo: string | null;
  sent_at: string | null;
  sent_to: string | null;
  send_method: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AssetDecisionAction = 'collect' | 'leave_bill' | 'partial' | 'close_config' | 'remain_customer';

export interface AssetDecision {
  key: string;
  assetId: string;
  type: AssetType;
  owner: AssetOwner;
  name: string;
  model: string;
  serial: string;
  qty: number;
  location: string;
  action: AssetDecisionAction;
  collectQty: number;
  billQty: number;
  originalCost: number;
  unitCost: number;
  unamortized: number;
  monthlyRate?: number;
}

export interface TerminationPlan {
  id: string;
  contract_no: string;
  customer_code: string | null;
  customer_name: string | null;
  term_date: string;
  remaining: number | null;
  penalty_rate: number;
  admin_fee: number;
  unpaid: number;
  memo: string | null;
  asset_decisions: AssetDecision[];
  saved_by: string | null;
  saved_at: string;
}

export interface Application {
  id: string;
  no: string;
  date: string;
  source: string | null;
  status: ApplicationStatus;
  customer_code: string | null;
  customer_name: string | null;
  agent_code: string | null;
  start_date: string | null;
  months: number | null;
  billing_date: string | null;
  inputs: QuoteInputs;
  monthly: number | null;
  calc: QuoteCalcSnapshot | null;
  quote_no: string | null;
  contract_no: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QuoteCalcSnapshot {
  rows: QuoteRowRecord[];
  monthly: number;
  monthlyCost: number;
  initCost: number;
  amort: number;
  totalCost: number;
  margin: number;
  commissionBase: number;
}

export interface ChangeRequest {
  id: string;
  no: string;
  date: string;
  effective_date: string | null;
  type: string | null;
  customer_code: string | null;
  customer_name: string | null;
  contract_no: string | null;
  agent_code: string | null;
  old_monthly: number | null;
  new_monthly: number | null;
  diff: number | null;
  old_inputs: QuoteInputs | null;
  new_inputs: QuoteInputs | null;
  old_equipment_selections: EquipmentSelection[] | null;
  new_equipment_selections: EquipmentSelection[] | null;
  old_service_selections: ServiceSelection[] | null;
  new_service_selections: ServiceSelection[] | null;
  /** Prorated one-time charge/credit for the remainder of the effective
   * month, from the fee difference — see calc/proration.ts. */
  settlement_amount: number | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
}
