'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getRates } from '@/lib/data-access/rates';
import { createQuote } from '@/lib/data-access/quotes';
import { calcQuoteForInputs } from '@/lib/calc/quote-calc';
import { bucketAmount, bucketMargin } from '@/lib/masking/staff-masking';
import type { QuoteInputs, Rates, EquipmentSelection } from '@/types/domain';

export interface QuotePreview {
  rows: {
    key: string;
    label: string;
    labelKey?: string;
    params?: Record<string, string | number>;
    amount: number;
    commissionable: boolean;
  }[];
  monthly: number;
  ppn: number;
  total: number;
  // Present only for master; staff receive the bucketed strings instead.
  monthlyCost?: number;
  totalCost?: number;
  margin?: number;
  monthlyCostBucket?: string;
  totalCostBucket?: string;
  marginBucket?: string;
}

/** Calculation always runs server-side against the real (unmasked) rates —
 * the browser never receives cost_fields/init_fields, only this
 * already-masked-if-staff preview. */
export async function calculateQuotePreviewAction(
  inputs: QuoteInputs,
  months: number
): Promise<QuotePreview> {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const rates = (await getRates(supabase, 'master')) as Rates;
  const calc = calcQuoteForInputs(rates, inputs, months);
  const ppn = Math.round((calc.monthly * rates.ppn) / 100);

  const rows = calc.rows.map((r) => ({
    key: r.key,
    label: r.label,
    labelKey: r.labelKey,
    params: r.params,
    amount: r.amount,
    commissionable: r.commissionable,
  }));

  if (session.role === 'master') {
    return {
      rows,
      monthly: calc.monthly,
      ppn,
      total: calc.monthly + ppn,
      monthlyCost: calc.monthlyCost,
      totalCost: calc.totalCost,
      margin: calc.margin,
    };
  }

  return {
    rows,
    monthly: calc.monthly,
    ppn,
    total: calc.monthly + ppn,
    monthlyCostBucket: bucketAmount(calc.monthlyCost),
    totalCostBucket: bucketAmount(calc.totalCost),
    marginBucket: bucketMargin(calc.margin),
  };
}

export interface CreateQuoteFormInput {
  customer_code: string;
  agent_code?: string;
  start_date: string;
  billing_date: string;
  months: number;
  inputs: QuoteInputs;
  equipment_selections?: EquipmentSelection[];
}

export async function createQuoteAction(input: CreateQuoteFormInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const rates = (await getRates(supabase, 'master')) as Rates;
  const quote = await createQuote(supabase, rates, { ...input, created_by: session.userId });
  revalidatePath('/quotes');
  return quote;
}
