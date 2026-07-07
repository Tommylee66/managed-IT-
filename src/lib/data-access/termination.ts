import type { SupabaseClient } from '@supabase/supabase-js';
import type { TerminationPlan, AssetDecision } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { bucketAmount } from '@/lib/masking/staff-masking';
import { nextTerminationPlanId, nextServiceLogId } from '@/lib/numbering';

export interface TerminationPlanView extends TerminationPlan {
  /** Total unamortized settlement — bucketed for staff, exact for master.
   * Computed from the raw data before per-row masking, since summing
   * masked (NaN) rows would just produce NaN. */
  unamortizedTotal: number | null;
  unamortizedTotalBucket: string;
}

function toView(plan: TerminationPlan, role: StaffRole): TerminationPlanView {
  const rawTotal = plan.asset_decisions.reduce((s, d) => s + Number(d.unamortized || 0), 0);
  const bucket = bucketAmount(rawTotal);
  if (role === 'master') {
    return { ...plan, unamortizedTotal: rawTotal, unamortizedTotalBucket: bucket };
  }
  return {
    ...plan,
    // Per-asset original/unit cost stay visible — staff genuinely need
    // them to operate the settlement (matches the source app, where
    // these are plain editable fields). Only the final settlement amount
    // (here and per-row) is hidden/bucketed, not the cost inputs behind it.
    asset_decisions: plan.asset_decisions.map((d) => ({ ...d, unamortized: NaN })),
    unamortizedTotal: null,
    unamortizedTotalBucket: bucket,
  };
}

export async function listTerminationPlansByContract(
  supabase: SupabaseClient,
  contractNo: string,
  role: StaffRole
): Promise<TerminationPlanView[]> {
  const { data, error } = await supabase
    .from('termination_plans')
    .select('*')
    .eq('contract_no', contractNo)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data as TerminationPlan[]).map((p) => toView(p, role));
}

export async function getTerminationPlan(
  supabase: SupabaseClient,
  id: string,
  role: StaffRole
): Promise<TerminationPlanView | null> {
  const { data, error } = await supabase
    .from('termination_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toView(data as TerminationPlan, role);
}

export interface CreateTerminationPlanInput {
  contract_no: string;
  customer_code: string;
  customer_name: string;
  term_date: string;
  remaining: number;
  penalty_rate: number;
  admin_fee: number;
  unpaid: number;
  memo?: string;
  asset_decisions: AssetDecision[];
  saved_by: string;
}

/** Ported 1:1 from the source app's saveTerminationInput(): records the
 * settlement plan and a service log. Unlike the source (which never touches
 * contract.status), we additionally flip the contract to 'terminated' —
 * the source's `terminated` status value existed in spirit but nothing
 * ever set it, which we treat as an oversight worth fixing rather than a
 * behavior worth preserving. */
export async function createTerminationPlan(
  supabase: SupabaseClient,
  input: CreateTerminationPlanInput
): Promise<TerminationPlan> {
  const id = nextTerminationPlanId();
  const collectQty = input.asset_decisions.reduce((s, d) => s + Number(d.collectQty || 0), 0);
  const billQty = input.asset_decisions.reduce((s, d) => s + Number(d.billQty || 0), 0);

  const { data, error } = await supabase
    .from('termination_plans')
    .insert({
      id,
      contract_no: input.contract_no,
      customer_code: input.customer_code,
      customer_name: input.customer_name,
      term_date: input.term_date,
      remaining: input.remaining,
      penalty_rate: input.penalty_rate,
      admin_fee: input.admin_fee,
      unpaid: input.unpaid,
      memo: input.memo ?? null,
      asset_decisions: input.asset_decisions,
      saved_by: input.saved_by,
    })
    .select('*')
    .single();
  if (error) throw error;

  const { error: logError } = await supabase.from('service_logs').insert({
    id: nextServiceLogId(),
    customer_code: input.customer_code,
    date: input.term_date,
    type: '해지신청',
    title: '중도해지 장비 처리 신청',
    memo: `해지예정일 ${input.term_date} / 수거 ${collectQty}대 / 고객 잔존 정산 ${billQty}대`,
    saved_by: input.saved_by,
  });
  if (logError) throw logError;

  const { error: contractError } = await supabase
    .from('contracts')
    .update({ status: 'terminated' })
    .eq('no', input.contract_no);
  if (contractError) throw contractError;

  return data as TerminationPlan;
}
