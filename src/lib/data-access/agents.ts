import type { SupabaseClient } from '@supabase/supabase-js';
import type { Agent, AgentBank, AgentRateHistoryEntry } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { maskBankAccount, maskPhoneNumber, maskEmail, maskTaxId } from '@/lib/masking/staff-masking';
import { nextAgentCode } from '@/lib/numbering';

function applyAgentMasking(agent: Agent, role: StaffRole): Agent {
  if (role === 'master') return agent;
  return {
    ...agent,
    phone: maskPhoneNumber(agent.phone),
    email: maskEmail(agent.email),
    bank: maskBankAccount(agent.bank) as AgentBank | null,
    npwp: agent.npwp ? maskTaxId(agent.npwp) : agent.npwp,
    ktp: agent.ktp ? maskTaxId(agent.ktp) : agent.ktp,
  };
}

export async function listAgents(supabase: SupabaseClient, role: StaffRole): Promise<Agent[]> {
  const { data, error } = await supabase.from('agents').select('*').order('code');
  if (error) throw error;
  return (data as Agent[]).map((a) => applyAgentMasking(a, role));
}

export async function getAgent(
  supabase: SupabaseClient,
  code: string,
  role: StaffRole
): Promise<Agent | null> {
  const { data, error } = await supabase.from('agents').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return applyAgentMasking(data as Agent, role);
}

export interface CreateAgentInput {
  name: string;
  rate: number;
  first_date?: string;
  phone?: string;
  email?: string;
  bank?: AgentBank;
  npwp?: string;
  ktp?: string;
  address?: string;
  memo?: string;
}

export async function createAgent(
  supabase: SupabaseClient,
  input: CreateAgentInput
): Promise<Agent> {
  const code = await nextAgentCode(supabase);
  const history: AgentRateHistoryEntry[] = input.first_date
    ? [{ date: input.first_date, rate: input.rate, recordedAt: new Date().toISOString() }]
    : [];
  const { data, error } = await supabase
    .from('agents')
    .insert({ ...input, code, history })
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}

/** Changing an agent's commission rate appends to the history log rather
 * than overwriting it — the source app tracks this so commission
 * calculations on existing contracts aren't retroactively affected. */
export async function changeAgentRate(
  supabase: SupabaseClient,
  code: string,
  newRate: number,
  effectiveDate: string
): Promise<Agent> {
  const existing = await getAgent(supabase, code, 'master');
  if (!existing) throw new Error('Agent not found');

  const history: AgentRateHistoryEntry[] = [
    ...existing.history,
    { date: effectiveDate, rate: newRate, recordedAt: new Date().toISOString() },
  ];

  const { data, error } = await supabase
    .from('agents')
    .update({ rate: newRate, change_date: effectiveDate, history })
    .eq('code', code)
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}

export interface UpdateAgentInfoInput {
  phone?: string;
  email?: string;
  bank?: AgentBank;
  npwp?: string;
  ktp?: string;
  address?: string;
  memo?: string;
}

/** Master-only in the UI layer — same reasoning as EditCustomerForm: a
 * staff viewer only ever sees masked npwp/ktp/bank values, so letting them
 * submit this form would silently overwrite the real values with masked
 * placeholders. */
export async function updateAgentInfo(
  supabase: SupabaseClient,
  code: string,
  input: UpdateAgentInfoInput
): Promise<Agent> {
  const { data, error } = await supabase
    .from('agents')
    .update(input)
    .eq('code', code)
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}

export async function setAgentActive(
  supabase: SupabaseClient,
  code: string,
  active: boolean
): Promise<Agent> {
  const { data, error } = await supabase
    .from('agents')
    .update({ active })
    .eq('code', code)
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}
