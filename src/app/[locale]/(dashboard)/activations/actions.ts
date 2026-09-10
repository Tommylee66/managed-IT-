'use server';

import { revalidatePath } from 'next/cache';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getContractRaw } from '@/lib/data-access/contracts';
import { createActivation } from '@/lib/data-access/activations';
import { resolveAssetsForActivation } from '@/lib/data-access/assets';
import {
  listServiceCatalog,
  resolveActivationServiceSelections,
  type ActivationServiceSelectionRequest,
} from '@/lib/data-access/services';
import type { Activation } from '@/types/domain';

interface CreateActivationActionInput {
  contract_no: string;
  date: string;
  billing_date: string;
  engineer?: string;
  site?: string;
  customer_pic?: string;
  confirm_type?: string;
  security_summary?: string;
  status: Activation['status'];
  notes?: string;
  asset_ids: string[];
  services: ActivationServiceSelectionRequest[];
}

export async function createActivationAction(input: CreateActivationActionInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const [t, tContracts, tCommon, locale] = await Promise.all([
    getTranslations('activations'),
    getTranslations('contracts'),
    getTranslations('common'),
    getLocale(),
  ]);
  const assetIds = Array.isArray(input.asset_ids) ? input.asset_ids : [];
  const serviceRequests = Array.isArray(input.services) ? input.services : [];
  if (!assetIds.length) throw new Error(t('assetsRequiredError'));
  if (
    serviceRequests.some(
      (service) =>
        !service ||
        typeof service.catalogId !== 'string' ||
        (service.detail != null &&
          (typeof service.detail !== 'string' || service.detail.length > 4000))
    )
  ) {
    throw new Error(t('serviceSelectionInvalidError'));
  }

  const supabase = await createClient();
  const [contract, serviceCatalog] = await Promise.all([
    getContractRaw(supabase, input.contract_no),
    listServiceCatalog(supabase, { activeOnly: true, role: 'master' }),
  ]);
  if (!contract) throw new Error(tContracts('notFoundError'));

  let assets;
  try {
    assets = await resolveAssetsForActivation(
      supabase,
      assetIds,
      contract.no,
      contract.customer_code
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_ASSET_SELECTION') {
      throw new Error(t('assetSelectionInvalidError'));
    }
    throw error;
  }

  const serviceSelections = resolveActivationServiceSelections(serviceRequests, serviceCatalog);
  if (serviceSelections.length !== serviceRequests.length) {
    throw new Error(t('serviceSelectionInvalidError'));
  }

  const activation = await createActivation(
    supabase,
    contract,
    {
      ...input,
      assets,
      service_selections: serviceSelections,
      saved_by: session.userId,
    },
    {
      ownerBct: tCommon('ownerBctShort'),
      ownerCustomer: tCommon('ownerCustomerShort'),
      noAssets: t('assetSummaryEmpty'),
      assetHistoryType: t('assetHistoryType'),
      serviceLogType: t('serviceLogType'),
      billingDateLabel: t('serviceLogBillingDateLabel'),
      engineerLabel: t('serviceLogEngineerLabel'),
      assetsLabel: t('serviceLogAssetsLabel'),
      servicesLabel: t('serviceLogServicesLabel'),
      noServices: t('serviceSummaryEmpty'),
      locale,
    }
  );

  revalidatePath('/activations');
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${input.contract_no}`);
  revalidatePath('/assets');
  revalidatePath('/customers');
  return activation;
}
