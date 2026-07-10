import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quote, QuoteInputs, Rates, EquipmentSelection } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { bucketAmount, bucketMargin } from '@/lib/masking/staff-masking';
import { calcQuoteForInputs } from '@/lib/calc/quote-calc';
import { mergeEquipmentIntoCalc } from '@/lib/calc/equipment-pricing';
import { nextQuoteNo } from '@/lib/numbering';

function applyQuoteMasking(quote: Quote, role: StaffRole): Quote {
  if (role === 'master') return quote;
  return {
    ...quote,
    // Aggregate cost/margin figures reveal internal pricing strategy —
    // bucketed for staff rather than hidden outright (they still need a
    // rough sense of margin to negotiate discounts sensibly).
    monthly_cost: NaN,
    init_cost: NaN,
    amort: NaN,
    total_cost: NaN,
    margin: NaN,
    rows: quote.rows.map((r) => ({ ...r, cost: NaN, init: NaN })),
  };
}

/** String-typed bucketed view for staff — used by the UI layer instead of
 * the raw numeric fields above, which are NaN placeholders after masking. */
export interface StaffQuoteSummary {
  monthlyCostBucket: string;
  totalCostBucket: string;
  marginBucket: string;
}

export function summarizeQuoteForStaff(quote: Quote): StaffQuoteSummary {
  return {
    monthlyCostBucket: bucketAmount(quote.monthly_cost),
    totalCostBucket: bucketAmount(quote.total_cost),
    marginBucket: bucketMargin(quote.margin),
  };
}

export async function listQuotes(supabase: SupabaseClient, role: StaffRole): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Quote[]).map((q) => applyQuoteMasking(q, role));
}

export async function listQuotesByCustomer(
  supabase: SupabaseClient,
  customerCode: string,
  role: StaffRole
): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_code', customerCode)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Quote[]).map((q) => applyQuoteMasking(q, role));
}

export async function getQuote(
  supabase: SupabaseClient,
  no: string,
  role: StaffRole
): Promise<Quote | null> {
  const { data, error } = await supabase.from('quotes').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return applyQuoteMasking(data as Quote, role);
}

/** Unmasked read — for internal use only (e.g. converting a quote to a
 * contract, where the real commission_base/rows are required). */
export async function getQuoteRaw(supabase: SupabaseClient, no: string): Promise<Quote | null> {
  const { data, error } = await supabase.from('quotes').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  return data as Quote | null;
}

export interface CreateQuoteInput {
  customer_code: string;
  agent_code?: string;
  start_date: string;
  billing_date: string;
  months: number;
  inputs: QuoteInputs;
  equipment_selections?: EquipmentSelection[];
  created_by: string;
}

/** Computes the quote using the full (unmasked) rates row — the caller must
 * pass a `rates` object that includes cost_fields/init_fields, i.e. fetched
 * via getRates(supabase, 'master') regardless of the acting user's own role.
 * Pricing math always needs real costs; only the *stored result* gets
 * masked later when read back by a `staff`-role viewer. */
export async function createQuote(
  supabase: SupabaseClient,
  rates: Rates,
  input: CreateQuoteInput
): Promise<Quote> {
  const calc = mergeEquipmentIntoCalc(
    calcQuoteForInputs(rates, input.inputs, input.months),
    input.equipment_selections ?? []
  );
  const no = await nextQuoteNo(supabase);
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      no,
      customer_code: input.customer_code,
      agent_code: input.agent_code ?? null,
      start_date: input.start_date,
      billing_date: input.billing_date,
      months: input.months,
      inputs: input.inputs,
      rows: calc.rows,
      equipment_selections: input.equipment_selections ?? [],
      monthly: calc.monthly,
      monthly_cost: calc.monthlyCost,
      init_cost: calc.initCost,
      amort: calc.amort,
      total_cost: calc.totalCost,
      margin: calc.margin,
      commission_base: calc.commissionBase,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Quote;
}

export interface UpdateQuoteInput {
  customer_code: string;
  agent_code?: string;
  start_date: string;
  billing_date: string;
  months: number;
  inputs: QuoteInputs;
  equipment_selections?: EquipmentSelection[];
}

/** Recomputes and overwrites an existing quote in place — same pricing rules
 * as createQuote. `no`/`created_by`/`created_at` are left untouched; note
 * this does not retroactively change any contract already created from this
 * quote (contracts snapshot the quote at creation time). */
export async function updateQuote(
  supabase: SupabaseClient,
  rates: Rates,
  no: string,
  input: UpdateQuoteInput
): Promise<Quote> {
  const calc = mergeEquipmentIntoCalc(
    calcQuoteForInputs(rates, input.inputs, input.months),
    input.equipment_selections ?? []
  );
  const { data, error } = await supabase
    .from('quotes')
    .update({
      customer_code: input.customer_code,
      agent_code: input.agent_code ?? null,
      start_date: input.start_date,
      billing_date: input.billing_date,
      months: input.months,
      inputs: input.inputs,
      rows: calc.rows,
      equipment_selections: input.equipment_selections ?? [],
      monthly: calc.monthly,
      monthly_cost: calc.monthlyCost,
      init_cost: calc.initCost,
      amort: calc.amort,
      total_cost: calc.totalCost,
      margin: calc.margin,
      commission_base: calc.commissionBase,
    })
    .eq('no', no)
    .select('*')
    .single();
  if (error) throw error;
  return data as Quote;
}
