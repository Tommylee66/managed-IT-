'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { updateRetentionPolicy, purgeExpiredPersonalData } from '@/lib/data-access/retention';
import type { RetentionKey } from '@/types/domain';

export async function updateRetentionPolicyAction(
  key: RetentionKey,
  input: { months: number; enabled: boolean }
) {
  const session = await requireMaster();
  const supabase = await createClient();
  await updateRetentionPolicy(supabase, key, input, session.userId);
  revalidatePath('/admin/retention');
}

export async function purgeExpiredPersonalDataAction() {
  await requireMaster();
  const supabase = await createClient();
  const result = await purgeExpiredPersonalData(supabase);
  revalidatePath('/admin/retention');
  return result;
}
