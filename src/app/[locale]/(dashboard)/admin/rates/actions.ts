'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { updateRates } from '@/lib/data-access/rates';
import {
  createEquipmentCatalogItem,
  setEquipmentCatalogActive,
  type CreateEquipmentInput,
} from '@/lib/data-access/equipment';
import type { Rates } from '@/types/domain';

export async function updateRatesAction(input: Partial<Omit<Rates, 'id' | 'updated_at'>>) {
  const session = await requireMaster();
  const supabase = await createClient();
  const rates = await updateRates(supabase, input, session.userId);
  revalidatePath('/admin/rates');
  return rates;
}

export async function createEquipmentCatalogItemAction(
  input: Omit<CreateEquipmentInput, 'created_by'>
) {
  const session = await requireMaster();
  const supabase = await createClient();
  const item = await createEquipmentCatalogItem(supabase, { ...input, created_by: session.userId });
  revalidatePath('/admin/rates');
  return item;
}

export async function setEquipmentCatalogActiveAction(id: string, isActive: boolean) {
  await requireMaster();
  const supabase = await createClient();
  const item = await setEquipmentCatalogActive(supabase, id, isActive);
  revalidatePath('/admin/rates');
  return item;
}
