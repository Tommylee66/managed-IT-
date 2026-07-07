'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { createTerminationPlan, type CreateTerminationPlanInput } from '@/lib/data-access/termination';

export async function createTerminationPlanAction(
  input: Omit<CreateTerminationPlanInput, 'saved_by'>
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const plan = await createTerminationPlan(supabase, { ...input, saved_by: session.userId });
  revalidatePath('/termination');
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${input.contract_no}`);
  return plan;
}
