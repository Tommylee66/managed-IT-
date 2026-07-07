'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getContractRaw } from '@/lib/data-access/contracts';
import { createActivation, type CreateActivationInput } from '@/lib/data-access/activations';

export async function createActivationAction(
  input: Omit<CreateActivationInput, 'saved_by'>
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const [t, tContracts, tCommon] = await Promise.all([
    getTranslations('activations'),
    getTranslations('contracts'),
    getTranslations('common'),
  ]);
  if (!input.assets.length) throw new Error(t('assetsRequiredError'));
  const bad = input.assets.find((a) => !a.name || !a.qty || a.qty < 1);
  if (bad) throw new Error(t('assetRowInvalidError'));

  const supabase = await createClient();
  const contract = await getContractRaw(supabase, input.contract_no);
  if (!contract) throw new Error(tContracts('notFoundError'));

  const activation = await createActivation(
    supabase,
    contract,
    {
      ...input,
      saved_by: session.userId,
    },
    {
      ownerBct: tCommon('ownerBctShort'),
      ownerCustomer: tCommon('ownerCustomerShort'),
      noAssets: t('assetSummaryEmpty'),
    }
  );

  revalidatePath('/activations');
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${input.contract_no}`);
  revalidatePath('/assets');
  revalidatePath('/customers');
  return activation;
}
