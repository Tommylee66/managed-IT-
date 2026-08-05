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
import { createStaffAccount, generateTempPassword } from '@/lib/auth/create-staff-account';

export interface CreateAgentResult {
  agent: Awaited<ReturnType<typeof createAgent>>;
  /** Present only when a sales_agent login was auto-created alongside the
   * agent (master session + an email was given). The password is only ever
   * available here, at creation time — hand it to the agent or reset it
   * later via the staff admin page. */
  staffAccount: { email: string; tempPassword: string } | null;
}

export async function createAgentAction(input: CreateAgentInput): Promise<CreateAgentResult> {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const agent = await createAgent(supabase, input);
  revalidatePath('/agents');

  // Auto-register a linked sales_agent login so master doesn't have to
  // separately open the staff admin page and re-type the agent's name/email
  // — only when there's an email to log in with, and only master can create
  // staff accounts (mirrors the requireMaster() gate on the staff API route).
  let staffAccount: CreateAgentResult['staffAccount'] = null;
  if (session.role === 'master' && input.email) {
    try {
      const tempPassword = generateTempPassword();
      const created = await createStaffAccount(supabase, session.userId, {
        email: input.email,
        password: tempPassword,
        full_name: input.name,
        role: 'sales_agent',
        agent_code: agent.code,
      });
      staffAccount = { email: created.email, tempPassword };
    } catch {
      // Agent creation already succeeded — don't roll that back over a
      // login-creation failure (e.g. the email is already registered).
      // Master can still link/create a staff account manually afterward.
    }
  }

  return { agent, staffAccount };
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
