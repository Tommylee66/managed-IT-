'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getContractRaw } from '@/lib/data-access/contracts';
import { getRates } from '@/lib/data-access/rates';
import { createChangeRequest, type CreateChangeRequestInput } from '@/lib/data-access/change-requests';
import type { Rates } from '@/types/domain';

export async function createChangeRequestAction(
  contractNo: string,
  input: Omit<CreateChangeRequestInput, 'created_by'>
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const contract = await getContractRaw(supabase, contractNo);
  if (!contract) {
    const t = await getTranslations('contracts');
    throw new Error(t('notFoundError'));
  }
  const rates = (await getRates(supabase, 'master')) as Rates;

  const changeRequest = await createChangeRequest(supabase, contract, rates, {
    ...input,
    created_by: session.userId,
  });
  revalidatePath('/change-requests');
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${contractNo}`);
  return changeRequest;
}
