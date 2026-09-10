'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireMaster } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createAsset, updateAsset, type AssetMutationInput } from '@/lib/data-access/assets';
import { getCustomerRaw } from '@/lib/data-access/customers';
import { getContractRaw } from '@/lib/data-access/contracts';
import {
  ASSET_CONDITIONS,
  ASSET_OWNERS,
  ASSET_STATUSES,
  ASSET_TYPES,
} from '@/lib/assets/constants';

const nullableText = (max: number) =>
  z
    .union([z.string().max(max), z.null()])
    .optional()
    .transform((value) => value?.trim() || null);

const assetInputSchema = z.object({
  customer_code: nullableText(20),
  contract_no: nullableText(40),
  type: z.enum(ASSET_TYPES),
  owner: z.enum(ASSET_OWNERS),
  name: z.string().trim().min(1).max(255),
  model: nullableText(255),
  serial: nullableText(4000),
  qty: z.number().int().min(1).max(100000),
  location: nullableText(255),
  condition: z.enum(ASSET_CONDITIONS),
  warranty: nullableText(100),
  notes: nullableText(4000),
  status: z.enum(ASSET_STATUSES),
});

type ParsedAssetInput = z.infer<typeof assetInputSchema>;

async function canonicalizeAssociation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: ParsedAssetInput
): Promise<AssetMutationInput> {
  if (input.contract_no) {
    const contract = await getContractRaw(supabase, input.contract_no);
    if (!contract) throw new Error('ASSET_CONTRACT_NOT_FOUND');
    if (input.customer_code && input.customer_code !== contract.customer_code) {
      throw new Error('ASSET_CUSTOMER_CONTRACT_MISMATCH');
    }
    return {
      ...input,
      contract_no: contract.no,
      customer_code: contract.customer_code,
      customer_name: contract.customer_name,
    };
  }

  if (input.customer_code) {
    const customer = await getCustomerRaw(supabase, input.customer_code);
    if (!customer) throw new Error('ASSET_CUSTOMER_NOT_FOUND');
    return {
      ...input,
      contract_no: null,
      customer_code: customer.code,
      customer_name: customer.name,
    };
  }

  return {
    ...input,
    contract_no: null,
    customer_code: null,
    customer_name: null,
  };
}

function revalidateAssetViews() {
  revalidatePath('/assets');
  revalidatePath('/customers');
  revalidatePath('/contracts');
  revalidatePath('/activations');
}

export async function createAssetAction(input: unknown) {
  const session = await requireMaster();
  const parsed = assetInputSchema.parse(input);
  const supabase = await createClient();
  const asset = await createAsset(
    supabase,
    await canonicalizeAssociation(supabase, parsed),
    session.userId
  );
  revalidateAssetViews();
  return { id: asset.id, asset_id: asset.asset_id };
}

export async function updateAssetAction(id: string, input: unknown) {
  await requireMaster();
  const assetId = z.string().uuid().parse(id);
  const parsed = assetInputSchema.parse(input);
  const supabase = await createClient();
  const asset = await updateAsset(supabase, assetId, await canonicalizeAssociation(supabase, parsed));
  revalidateAssetViews();
  return { id: asset.id, asset_id: asset.asset_id };
}
