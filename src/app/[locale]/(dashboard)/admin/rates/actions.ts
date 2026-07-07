'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { updateRates } from '@/lib/data-access/rates';
import type { Rates } from '@/types/domain';

export async function updateRatesAction(input: Partial<Omit<Rates, 'id' | 'updated_at'>>) {
  const session = await requireMaster();
  const supabase = await createClient();
  const rates = await updateRates(supabase, input, session.userId);
  revalidatePath('/admin/rates');
  return rates;
}
