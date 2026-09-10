import type { AssetCondition, AssetOwner, AssetType } from '@/types/domain';

export const ASSET_TYPES = [
  'router',
  'ap',
  'hub_switch',
  'cctv',
  'security',
  'vpn_config',
  'starlink',
  'pc_server',
  'printer',
  'ip_pbx',
  'other',
] as const satisfies readonly AssetType[];

export const ASSET_OWNERS = ['bct', 'customer'] as const satisfies readonly AssetOwner[];

export const ASSET_CONDITIONS = [
  'installed',
  'pending',
  'spare',
  'customer_owned',
  'faulty',
  'returned',
  'removed',
] as const satisfies readonly AssetCondition[];

export const ASSET_STATUSES = ['active', 'inactive'] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export interface AssetEditorInput {
  customer_code: string | null;
  contract_no: string | null;
  type: AssetType;
  owner: AssetOwner;
  name: string;
  model: string | null;
  serial: string | null;
  qty: number;
  location: string | null;
  condition: AssetCondition;
  warranty: string | null;
  notes: string | null;
  status: AssetStatus;
}
