import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChangeRequest, Contract, EquipmentSelection, ServiceSelection, QuoteInputs, Rates } from '@/types/domain';
import { calcQuoteForInputs } from '@/lib/calc/quote-calc';
import { mergeEquipmentIntoCalc } from '@/lib/calc/equipment-pricing';
import { mergeServiceIntoCalc } from '@/lib/calc/service-pricing';
import { calcProratedSettlement } from '@/lib/calc/proration';
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

export async function listChangeRequestsByCustomer(
  supabase: SupabaseClient,
  customerCode: string
): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('customer_code', customerCode)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ChangeRequest[];
}

export interface CreateChangeRequestInput {
  type: string;
  effective_date: string;
  new_inputs: QuoteInputs;
  new_equipment_selections?: EquipmentSelection[];
  new_service_selections?: ServiceSelection[];
  memo?: string;
  created_by: string;
}

/** Ported 1:1 from the source app's saveChangeRequest(): recalculates the
 * contract's monthly fee from the new service inputs (using the contract's
 * existing months — the pricing term doesn't restart), records the change,
 * and updates the contract's current billing figures + quote snapshot in
 * place so future invoices reflect the new amount immediately.
 *
 * Also settles the current partial month: the fee difference is prorated
 * across the days remaining from `effective_date` to month end and stored
 * as a one-time `settlement_amount` — the new monthly rate itself only
 * takes effect starting next month's invoice (which reads contract.monthly_fee
 * fresh each time, so no separate propagation is needed there). */
export async function createChangeRequest(
  supabase: SupabaseClient,
  contract: Contract,
  rates: Rates,
  input: CreateChangeRequestInput
): Promise<ChangeRequest> {
  const oldInputs = contract.quote_snapshot?.inputs as QuoteInputs | undefined;
  const oldEquipmentSelections = contract.quote_snapshot?.equipment_selections ?? [];
  const oldServiceSelections = contract.quote_snapshot?.service_selections ?? [];
  const oldMonthly = Number(contract.monthly_fee || 0);
  const newEquipmentSelections = input.new_equipment_selections ?? [];
  const newServiceSelections = input.new_service_selections ?? [];
  const calc = mergeServiceIntoCalc(
    mergeEquipmentIntoCalc(
      calcQuoteForInputs(rates, input.new_inputs, contract.months),
      newEquipmentSelections
    ),
    newServiceSelections
  );
  const diff = calc.monthly - oldMonthly;
  const settlementAmount = calcProratedSettlement(input.effective_date, diff);
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
      old_equipment_selections: oldEquipmentSelections,
      new_equipment_selections: newEquipmentSelections,
      old_service_selections: oldServiceSelections,
      new_service_selections: newServiceSelections,
      settlement_amount: settlementAmount,
      memo: input.memo ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;

  const updatedSnapshot = {
    ...contract.quote_snapshot,
    inputs: input.new_inputs,
    equipment_selections: newEquipmentSelections,
    service_selections: newServiceSelections,
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
    memo: `월 증감액 ${diff}, 당월 정산액 ${settlementAmount}\n${input.memo ?? ''}`,
    saved_by: input.created_by,
  });

  return data as ChangeRequest;
}
