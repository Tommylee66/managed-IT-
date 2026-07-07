import type { SupabaseClient } from '@supabase/supabase-js';
import type { Application, QuoteInputs, Rates } from '@/types/domain';
import { calcQuoteForInputs } from '@/lib/calc/quote-calc';
import { nextApplicationNo, nextQuoteNo } from '@/lib/numbering';

// Applications don't currently carry any field flagged sensitive in the
// masking plan (no tax_id/phone/margin/commission of their own — those
// live on the linked customer/quote records), so no masking is applied here.

export async function listApplications(supabase: SupabaseClient): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Application[];
}

export async function getApplication(
  supabase: SupabaseClient,
  no: string
): Promise<Application | null> {
  const { data, error } = await supabase.from('applications').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  return data as Application | null;
}

export interface CreateApplicationInput {
  source: string;
  customer_code: string;
  customer_name: string;
  agent_code?: string;
  start_date: string;
  months: number;
  billing_date: string;
  inputs: QuoteInputs;
  memo?: string;
  created_by: string;
}

/** Ported 1:1 from the source app's saveApplicationFromForm(): computes and
 * stores a quote-calculator snapshot at intake time, before a formal quote
 * document exists. */
export async function createApplication(
  supabase: SupabaseClient,
  rates: Rates,
  input: CreateApplicationInput
): Promise<Application> {
  const calc = calcQuoteForInputs(rates, input.inputs, input.months);
  const no = await nextApplicationNo(supabase);

  const { data, error } = await supabase
    .from('applications')
    .insert({
      no,
      date: input.start_date,
      source: input.source,
      status: 'received',
      customer_code: input.customer_code,
      customer_name: input.customer_name,
      agent_code: input.agent_code ?? null,
      start_date: input.start_date,
      months: input.months,
      billing_date: input.billing_date,
      inputs: input.inputs,
      monthly: calc.monthly,
      calc,
      memo: input.memo ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;

  await supabase.from('service_logs').insert({
    id: `LOG${Date.now().toString(36)}`,
    customer_code: input.customer_code,
    date: input.start_date,
    type: '신규신청',
    title: `${no} / 신청접수`,
    memo: `월 예상금액 ${calc.monthly}`,
    saved_by: input.created_by,
  });

  return data as Application;
}

/** Ported 1:1 from the source app's loadApplicationToQuote() +
 * calculateQuote(save=true): converts the application's stored inputs into
 * a real quote document, and links the two records together. */
export async function convertApplicationToQuote(
  supabase: SupabaseClient,
  application: Application,
  rates: Rates,
  createdBy: string
): Promise<string> {
  const calc = calcQuoteForInputs(rates, application.inputs, application.months ?? 36);
  const quoteNo = await nextQuoteNo(supabase);

  const { error: quoteError } = await supabase.from('quotes').insert({
    no: quoteNo,
    customer_code: application.customer_code,
    agent_code: application.agent_code,
    start_date: application.start_date,
    billing_date: application.billing_date,
    months: application.months ?? 36,
    inputs: application.inputs,
    rows: calc.rows,
    monthly: calc.monthly,
    monthly_cost: calc.monthlyCost,
    init_cost: calc.initCost,
    amort: calc.amort,
    total_cost: calc.totalCost,
    margin: calc.margin,
    commission_base: calc.commissionBase,
    created_by: createdBy,
  });
  if (quoteError) throw quoteError;

  const { error: appError } = await supabase
    .from('applications')
    .update({ status: 'quote_ready', quote_no: quoteNo })
    .eq('no', application.no);
  if (appError) throw appError;

  return quoteNo;
}
