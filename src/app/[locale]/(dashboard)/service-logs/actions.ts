'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { createServiceLog } from '@/lib/data-access/service-logs';

export async function createServiceLogAction(input: {
  customer_code: string;
  date: string;
  type: string;
  title?: string;
  memo?: string;
}) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const log = await createServiceLog(supabase, { ...input, saved_by: session.userId });
  revalidatePath('/service-logs');
  revalidatePath(`/customers/${input.customer_code}`);
  return log;
}
