import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChangeRequest, Contract, QuoteInputs, Rates } from '@/types/domain';
import { calcQuoteForInputs } from '@/lib/calc/quote-calc';
import { nextChangeRequestNo } from '@/lib/numbering';

export async function listChangeRequests(supabase: SupabaseClient): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ChangeRequest[];
}

export async function listChangeRequestsByContract(
  supabase: SupabaseClient,
  contractNo: string
): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('contract_no', contractNo)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ChangeRequest[];
}

export interface CreateChangeRequestInput {
  type: string;
  effective_date: string;
  new_inputs: QuoteInputs;
  memo?: string;
  created_by: string;
}

/** Ported 1:1 from the source app's saveChangeRequest(): recalculates the
 * contract's monthly fee from the new service inputs (using the contract's
 * existing months — the pricing term doesn't restart), records the change,
 * and updates the contract's current billing figures + quote snapshot in
 * place so future invoices reflect the new amount immediately. */
export async function createChangeRequest(
  supabase: SupabaseClient,
  contract: Contract,
  rates: Rates,
  input: CreateChangeRequestInput
): Promise<ChangeRequest> {
  const oldInputs = contract.quote_snapshot?.inputs as QuoteInputs | undefined;
  const oldMonthly = Number(contract.monthly_fee || 0);
  const calc = calcQuoteForInputs(rates, input.new_inputs, contract.months);
  const diff = calc.monthly - oldMonthly;
  const no = await nextChangeRequestNo(supabase);

  const { data, error } = await supabase
    .from('change_requests')
    .insert({
      no,
      date: input.effective_date,
      effective_date: input.effective_date,
      type: input.type,
      customer_code: contract.customer_code,
      customer_name: contract.customer_name,
      contract_no: contract.no,
      old_monthly: oldMonthly,
      new_monthly: calc.monthly,
      diff,
      old_inputs: oldInputs ?? null,
      new_inputs: input.new_inputs,
      memo: input.memo ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;

  const updatedSnapshot = {
    ...contract.quote_snapshot,
    inputs: input.new_inputs,
    rows: calc.rows,
    monthly: calc.monthly,
    monthly_cost: calc.monthlyCost,
    init_cost: calc.initCost,
    amort: calc.amort,
    total_cost: calc.totalCost,
    margin: calc.margin,
  };

  const { error: contractError } = await supabase
    .from('contracts')
    .update({ monthly_fee: calc.monthly, quote_snapshot: updatedSnapshot })
    .eq('no', contract.no);
  if (contractError) throw contractError;

  await supabase.from('service_logs').insert({
    id: `LOG${Date.now().toString(36)}`,
    customer_code: contract.customer_code,
    date: input.effective_date,
    type: '변경신청',
    title: `${no} / ${input.type} / 월 ${oldMonthly} → ${calc.monthly}`,
    memo: `월 증감액 ${diff}\n${input.memo ?? ''}`,
    saved_by: input.created_by,
  });

  return data as ChangeRequest;
}
