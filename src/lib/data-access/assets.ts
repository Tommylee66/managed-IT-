import type { SupabaseClient } from '@supabase/supabase-js';
import type { Asset } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { maskSerial } from '@/lib/masking/staff-masking';

function applyAssetMasking(asset: Asset, role: StaffRole): Asset {
  if (role === 'master') return asset;
  return { ...asset, serial: maskSerial(asset.serial) };
}

export async function listAssetsByCustomer(
  supabase: SupabaseClient,
  customerCode: string,
  role: StaffRole
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('customer_code', customerCode)
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return (data as Asset[]).map((a) => applyAssetMasking(a, role));
}

export async function listAssetsByContract(
  supabase: SupabaseClient,
  contractNo: string,
  role: StaffRole
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('contract_no', contractNo)
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return (data as Asset[]).map((a) => applyAssetMasking(a, role));
}

export async function listAssetsByActivationSnapshot(
  supabase: SupabaseClient,
  activationId: string,
  role: StaffRole
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('asset_history')
    .select('items')
    .eq('activation_id', activationId)
    .order('saved_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return ((data?.items ?? []) as Asset[]).map((asset) => applyAssetMasking(asset, role));
}

export async function listAllAssets(supabase: SupabaseClient, role: StaffRole): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return (data as Asset[]).map((a) => applyAssetMasking(a, role));
}

/** Resolve and validate IDs received from the activation form. An unassigned
 * asset can be claimed by the contract; an already-associated asset must
 * belong to this exact customer and contract. */
export async function resolveAssetsForActivation(
  supabase: SupabaseClient,
  assetIds: string[],
  contractNo: string,
  customerCode: string
): Promise<Asset[]> {
  const uniqueIds = [...new Set(assetIds)];
  if (uniqueIds.length !== assetIds.length) throw new Error('INVALID_ASSET_SELECTION');

  const { data, error } = await supabase.from('assets').select('*').in('id', uniqueIds);
  if (error) throw error;
  const assets = data as Asset[];
  if (assets.length !== uniqueIds.length) throw new Error('INVALID_ASSET_SELECTION');

  const invalid = assets.some(
    (asset) =>
      (asset.contract_no != null && asset.contract_no !== contractNo) ||
      (asset.customer_code != null && asset.customer_code !== customerCode)
  );
  if (invalid) throw new Error('INVALID_ASSET_SELECTION');

  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return uniqueIds.map((id) => byId.get(id)!);
}

/** Link existing inventory rows to the new activation instead of deleting
 * and recreating assets from free-text form input. */
export async function assignAssetsToActivation(
  supabase: SupabaseClient,
  assets: Asset[],
  contractNo: string,
  customerCode: string,
  customerName: string,
  activationId: string
): Promise<Asset[]> {
  const assetIds = assets.map((asset) => asset.id);
  const { data, error } = await supabase
    .from('assets')
    .update({
      activation_id: activationId,
      contract_no: contractNo,
      customer_code: customerCode,
      customer_name: customerName,
    })
    .in('id', assetIds)
    .select('*');
  if (error) throw error;
  const assigned = data as Asset[];
  if (assigned.length !== assetIds.length) throw new Error('INVALID_ASSET_SELECTION');

  const byId = new Map(assigned.map((asset) => [asset.id, asset]));
  return assetIds.map((id) => byId.get(id)!);
}

const TYPE_LABEL: Record<Asset['type'], string> = {
  router: 'Router',
  ap: 'AP',
  hub_switch: 'Hub/Switch',
  cctv: 'CCTV',
  security: 'Security',
  vpn_config: 'VPN Config',
  starlink: 'Starlink',
  pc_server: 'PC/Server',
  printer: 'Printer',
  ip_pbx: 'IP PBX',
  other: 'Other',
};

/** Ported from the source app's assetSummaryText(). The owner/empty labels
 * are passed in (rather than hardcoded) so the summary is written in
 * whichever locale is active for the staff member creating the record —
 * see the caller in activations.ts. */
export function assetSummaryText(
  rows: Array<Pick<Asset, 'type' | 'owner' | 'qty'>>,
  ownerLabels: { bct: string; customer: string },
  emptyLabel: string
): string {
  if (!rows.length) return emptyLabel;
  const by: Record<string, number> = {};
  for (const row of rows) {
    const key = (row.owner === 'bct' ? `${ownerLabels.bct} ` : `${ownerLabels.customer} `) + TYPE_LABEL[row.type];
    by[key] = (by[key] ?? 0) + Number(row.qty || 0);
  }
  return Object.entries(by)
    .map(([k, v]) => `${k} ${v}`)
    .join(' / ');
}
