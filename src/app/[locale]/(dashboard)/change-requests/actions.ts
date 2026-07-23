'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getContractRaw } from '@/lib/data-access/contracts';
import { getRates } from '@/lib/data-access/rates';
import { listEquipmentCatalog } from '@/lib/data-access/equipment';
import { listServiceCatalog } from '@/lib/data-access/services';
import { createChangeRequest, type CreateChangeRequestInput } from '@/lib/data-access/change-requests';
import { resolveEquipmentSelections, type EquipmentSelectionRequest } from '@/lib/calc/equipment-pricing';
import { resolveServiceSelections, type ServiceSelectionRequest } from '@/lib/calc/service-pricing';
import type { Rates } from '@/types/domain';

export type CreateChangeRequestFormInput = Omit<
  CreateChangeRequestInput,
  'created_by' | 'new_equipment_selections' | 'new_service_selections'
> & {
  new_equipment_selections?: EquipmentSelectionRequest[];
  new_service_selections?: ServiceSelectionRequest[];
};

export async function createChangeRequestAction(contractNo: string, input: CreateChangeRequestFormInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const contract = await getContractRaw(supabase, contractNo);
  if (!contract) {
    const t = await getTranslations('contracts');
    throw new Error(t('notFoundError'));
  }
  const rates = (await getRates(supabase, 'master')) as Rates;
  const catalog = await listEquipmentCatalog(supabase, { role: 'master' });
  const serviceCatalog = await listServiceCatalog(supabase, { role: 'master' });
  const resolved = resolveEquipmentSelections(input.new_equipment_selections ?? [], catalog);
  const resolvedServices = resolveServiceSelections(input.new_service_selections ?? [], serviceCatalog);

  const changeRequest = await createChangeRequest(supabase, contract, rates, {
    ...input,
    new_equipment_selections: resolved,
    new_service_selections: resolvedServices,
    created_by: session.userId,
  });
  revalidatePath('/change-requests');
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${contractNo}`);
  return changeRequest;
}
