'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMaster, getSessionContext } from '@/lib/auth/session';
import {
  createAgent,
  changeAgentRate,
  setAgentActive,
  updateAgentInfo,
  type CreateAgentInput,
  type UpdateAgentInfoInput,
} from '@/lib/data-access/agents';

export async function createAgentAction(input: CreateAgentInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const agent = await createAgent(supabase, input);
  revalidatePath('/agents');
  return agent;
}

export async function changeAgentRateAction(code: string, newRate: number, effectiveDate: string) {
  await requireMaster();
  const supabase = await createClient();
  const agent = await changeAgentRate(supabase, code, newRate, effectiveDate);
  revalidatePath('/agents');
  revalidatePath(`/agents/${code}`);
  return agent;
}

export async function updateAgentInfoAction(code: string, input: UpdateAgentInfoInput) {
  await requireMaster();
  const supabase = await createClient();
  const agent = await updateAgentInfo(supabase, code, input);
  revalidatePath('/agents');
  revalidatePath(`/agents/${code}`);
  return agent;
}

export async function setAgentActiveAction(code: string, active: boolean) {
  await requireMaster();
  const supabase = await createClient();
  const agent = await setAgentActive(supabase, code, active);
  revalidatePath('/agents');
  revalidatePath(`/agents/${code}`);
  return agent;
}
