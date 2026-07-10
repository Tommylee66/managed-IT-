'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import {
  createEquipmentCatalogItem,
  setEquipmentCatalogActive,
  type CreateEquipmentInput,
} from '@/lib/data-access/equipment';

export async function createEquipmentCatalogItemAction(
  input: Omit<CreateEquipmentInput, 'created_by'>
) {
  const session = await requireMaster();
  const supabase = await createClient();
  const item = await createEquipmentCatalogItem(supabase, { ...input, created_by: session.userId });
  revalidatePath('/admin/equipment');
  return item;
}

export async function setEquipmentCatalogActiveAction(id: string, isActive: boolean) {
  await requireMaster();
  const supabase = await createClient();
  const item = await setEquipmentCatalogActive(supabase, id, isActive);
  revalidatePath('/admin/equipment');
  return item;
}
