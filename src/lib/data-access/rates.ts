import type { SupabaseClient } from '@supabase/supabase-js';
import type { Rates } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';

/** Staff need the customer-facing pricing fields to run the quote
 * calculator, but never the internal cost/init basis — those reveal margin. */
export type StaffVisibleRates = Omit<Rates, 'cost_fields' | 'init_fields'>;

export async function getRates(
  supabase: SupabaseClient,
  role: StaffRole
): Promise<Rates | StaffVisibleRates> {
  const { data, error } = await supabase.from('rates').select('*').eq('id', 1).single();
  if (error) throw error;
  const rates = data as Rates;
  if (role === 'master') return rates;
  const visible = { ...rates };
  delete (visible as Partial<Rates>).cost_fields;
  delete (visible as Partial<Rates>).init_fields;
  return visible;
}

/** Only master can call this — enforced both by the RLS policy on `rates`
 * (UPDATE restricted to is_master()) and by the caller checking role first. */
export async function updateRates(
  supabase: SupabaseClient,
  input: Partial<Omit<Rates, 'id' | 'updated_at'>>,
  updatedBy: string
): Promise<Rates> {
  const { data, error } = await supabase
    .from('rates')
    .update({ ...input, updated_by: updatedBy })
    .eq('id', 1)
    .select('*')
    .single();
  if (error) throw error;
  return data as Rates;
}
