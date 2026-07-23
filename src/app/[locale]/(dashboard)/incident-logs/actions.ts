'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { createIncidentLog } from '@/lib/data-access/incident-logs';
import type { IncidentLogType } from '@/types/domain';

export async function createIncidentLogAction(input: {
  customer_code: string;
  type: IncidentLogType;
  occurred_date: string;
  title: string;
  description: string;
  resolution?: string;
  engineer?: string;
  memo?: string;
}) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const log = await createIncidentLog(supabase, { ...input, created_by: session.userId });
  revalidatePath('/incident-logs');
  return log;
}
