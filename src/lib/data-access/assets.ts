import type { SupabaseClient } from '@supabase/supabase-js';
import type { Asset } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { maskSerial } from '@/lib/masking/staff-masking';
import { nextAssetId } from '@/lib/numbering';

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

export async function listAllAssets(supabase: SupabaseClient, role: StaffRole): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return (data as Asset[]).map((a) => applyAssetMasking(a, role));
}

export interface AssetRowInput {
  type: Asset['type'];
  owner: Asset['owner'];
  name: string;
  model?: string;
  serial?: string;
  qty: number;
  location?: string;
  condition: Asset['condition'];
  warranty?: string;
  notes?: string;
}

/** Replaces all previously activation-sourced assets for this contract with
 * the new set — matches the source app's saveActivation(), which treats
 * each activation submission as the current authoritative asset list for
 * that contract (re-submitting corrects/replaces the prior registration). */
export async function replaceActivationAssets(
  supabase: SupabaseClient,
  contractNo: string,
  customerCode: string,
  customerName: string,
  activationId: string,
  rows: AssetRowInput[],
  registeredBy: string
): Promise<Asset[]> {
  const { error: deleteError } = await supabase
    .from('assets')
    .delete()
    .eq('contract_no', contractNo)
    .eq('source', 'activation');
  if (deleteError) throw deleteError;

  const assetsToInsert = [];
  for (const row of rows) {
    const assetId = await nextAssetId(supabase);
    assetsToInsert.push({
      asset_id: assetId,
      activation_id: activationId,
      contract_no: contractNo,
      customer_code: customerCode,
      customer_name: customerName,
      type: row.type,
      owner: row.owner,
      name: row.name,
      model: row.model ?? null,
      serial: row.serial ?? null,
      qty: row.qty,
      location: row.location ?? null,
      condition: row.condition,
      warranty: row.warranty ?? null,
      notes: row.notes ?? null,
      source: 'activation',
      status: 'active',
      registered_by: registeredBy,
    });
  }

  const { data, error } = await supabase.from('assets').insert(assetsToInsert).select('*');
  if (error) throw error;
  return data as Asset[];
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
  other: 'Other',
};

/** Ported from the source app's assetSummaryText(). The owner/empty labels
 * are passed in (rather than hardcoded) so the summary is written in
 * whichever locale is active for the staff member creating the record —
 * see the caller in activations.ts. */
export function assetSummaryText(
  rows: AssetRowInput[],
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
