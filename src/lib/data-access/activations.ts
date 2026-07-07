import type { SupabaseClient } from '@supabase/supabase-js';
import type { Activation, Contract } from '@/types/domain';
import { nextActivationId, nextAssetHistoryId, nextServiceLogId } from '@/lib/numbering';
import { replaceActivationAssets, assetSummaryText, type AssetRowInput } from '@/lib/data-access/assets';

export async function listActivations(supabase: SupabaseClient): Promise<Activation[]> {
  const { data, error } = await supabase
    .from('activations')
    .select('*')
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data as Activation[];
}

export async function getActivation(
  supabase: SupabaseClient,
  id: string
): Promise<Activation | null> {
  const { data, error } = await supabase.from('activations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Activation | null;
}

export interface CreateActivationInput {
  contract_no: string;
  date: string;
  billing_date: string;
  engineer?: string;
  site?: string;
  customer_pic?: string;
  confirm_type?: string;
  security_summary?: string;
  status: Activation['status'];
  notes?: string;
  assets: AssetRowInput[];
  saved_by: string;
}

/** Ported 1:1 from the source app's saveActivation() (final version, line
 * 389 of the source): registers the activation, replaces the contract's
 * activation-sourced assets, snapshots asset_history, writes a service log,
 * and — only when the activation's own status is 'activated' — flips the
 * contract and customer to 'activated' with billing_date/activation_date set.
 * (The source sometimes copies non-'activated' statuses like 'pending'/
 * 'issue' straight onto contract.status, but that's a loosely-typed artifact
 * of the original app with no shared enum — our contract_status enum only
 * allows contracted/activated/terminated, so we deliberately don't replicate
 * that part: a non-activated activation leaves the contract status as-is.)
 */
export async function createActivation(
  supabase: SupabaseClient,
  contract: Contract,
  input: CreateActivationInput,
  labels: { ownerBct: string; ownerCustomer: string; noAssets: string }
): Promise<Activation> {
  const activationId = nextActivationId();
  const summary = assetSummaryText(
    input.assets,
    { bct: labels.ownerBct, customer: labels.ownerCustomer },
    labels.noAssets
  );

  const { data: activation, error } = await supabase
    .from('activations')
    .insert({
      id: activationId,
      contract_no: input.contract_no,
      date: input.date,
      billing_date: input.billing_date,
      engineer: input.engineer ?? null,
      site: input.site ?? null,
      customer_pic: input.customer_pic ?? null,
      confirm_type: input.confirm_type ?? null,
      security_summary: input.security_summary ?? null,
      status: input.status,
      notes: input.notes ?? null,
      asset_summary: summary,
      saved_by: input.saved_by,
    })
    .select('*')
    .single();
  if (error) throw error;

  const assets = await replaceActivationAssets(
    supabase,
    input.contract_no,
    contract.customer_code,
    contract.customer_name,
    activationId,
    input.assets,
    input.saved_by
  );

  const { error: historyError } = await supabase.from('asset_history').insert({
    id: nextAssetHistoryId(),
    contract_no: input.contract_no,
    customer_code: contract.customer_code,
    type: '개통자산 등록',
    date: input.date,
    summary,
    activation_id: activationId,
    items: assets,
    saved_by: input.saved_by,
  });
  if (historyError) throw historyError;

  const { error: logError } = await supabase.from('service_logs').insert({
    id: nextServiceLogId(),
    customer_code: contract.customer_code,
    date: input.date,
    type: '개통완료',
    title: `과금시작일 ${input.billing_date}`,
    memo: `개통요원 ${input.engineer ?? ''}\n자산 ${summary}\n${input.notes ?? ''}`,
    saved_by: input.saved_by,
  });
  if (logError) throw logError;

  if (input.status === 'activated') {
    const { error: contractError } = await supabase
      .from('contracts')
      .update({ status: 'activated', billing_date: input.billing_date, activation_date: input.date })
      .eq('no', input.contract_no);
    if (contractError) throw contractError;

    const { error: custError } = await supabase
      .from('customers')
      .update({ status: 'activated' })
      .eq('code', contract.customer_code);
    if (custError) throw custError;
  }

  return activation as Activation;
}
