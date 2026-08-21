import type { SupabaseClient } from '@supabase/supabase-js';
import { getTranslations } from 'next-intl/server';
import type { TerminationPlan, AssetDecision } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { bucketAmount } from '@/lib/masking/staff-masking';
import { nextTerminationPlanId, nextServiceLogId } from '@/lib/numbering';
import { summarizeTerminationPlan } from '@/lib/calc/termination-calc';

export interface TerminationPlanView extends TerminationPlan {
  /** Total unamortized settlement, penalty, and grand total — bucketed for
   * staff, exact for master. Computed from the raw data (via the same
   * summarizeTerminationPlan() the creation form uses) before per-row
   * masking, since summing masked (NaN) rows would just produce NaN. */
  unamortizedTotal: number | null;
  penalty: number | null;
  total: number | null;
  unamortizedTotalBucket: string;
}

function toView(plan: TerminationPlan, role: StaffRole): TerminationPlanView {
  const summary = summarizeTerminationPlan(plan.asset_decisions, plan.penalty_rate, plan.admin_fee, plan.unpaid);
  const bucket = bucketAmount(summary.unamortizedTotal);
  if (role === 'master') {
    return { ...plan, unamortizedTotal: summary.unamortizedTotal, penalty: summary.penalty, total: summary.total, unamortizedTotalBucket: bucket };
  }
  return {
    ...plan,
    // Per-asset original/unit cost stay visible — staff genuinely need
    // them to operate the settlement (matches the source app, where
    // these are plain editable fields). Only the final settlement amount
    // (here and per-row) is hidden/bucketed, not the cost inputs behind it.
    asset_decisions: plan.asset_decisions.map((d) => ({ ...d, unamortized: NaN })),
    unamortizedTotal: null,
    penalty: null,
    total: null,
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

export async function listTerminationPlansByCustomer(
  supabase: SupabaseClient,
  customerCode: string,
  role: StaffRole
): Promise<TerminationPlanView[]> {
  const { data, error } = await supabase
    .from('termination_plans')
    .select('*')
    .eq('customer_code', customerCode)
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

  // See change-requests.ts's createChangeRequest for the write-time-locale
  // caveat this shares with every service_logs insert in this codebase.
  const t = await getTranslations('termination');
  const { error: logError } = await supabase.from('service_logs').insert({
    id: nextServiceLogId(),
    customer_code: input.customer_code,
    date: input.term_date,
    type: t('serviceLogType'),
    title: t('serviceLogTitle'),
    memo: t('serviceLogMemo', { termDate: input.term_date, collectQty, billQty }),
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
