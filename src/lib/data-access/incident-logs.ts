import type { SupabaseClient } from '@supabase/supabase-js';
import type { IncidentLog, IncidentLogType } from '@/types/domain';

export async function listAllIncidentLogs(supabase: SupabaseClient): Promise<IncidentLog[]> {
  const { data, error } = await supabase
    .from('incident_logs')
    .select('*')
    .order('occurred_date', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data as IncidentLog[];
}

export async function listIncidentLogsByCustomer(
  supabase: SupabaseClient,
  customerCode: string
): Promise<IncidentLog[]> {
  const { data, error } = await supabase
    .from('incident_logs')
    .select('*')
    .eq('customer_code', customerCode)
    .order('occurred_date', { ascending: false });
  if (error) throw error;
  return data as IncidentLog[];
}

/** monthKey is "YYYY-MM" — used by the monthly report generator to pull
 * exactly one calendar month's records (1일 ~ 말일) for a customer. */
export async function listIncidentLogsByCustomerAndMonth(
  supabase: SupabaseClient,
  customerCode: string,
  monthKey: string
): Promise<IncidentLog[]> {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('incident_logs')
    .select('*')
    .eq('customer_code', customerCode)
    .gte('occurred_date', monthStart)
    .lte('occurred_date', monthEnd)
    .order('occurred_date', { ascending: true });
  if (error) throw error;
  return data as IncidentLog[];
}

export interface CreateIncidentLogInput {
  customer_code: string;
  type: IncidentLogType;
  occurred_date: string;
  title: string;
  description: string;
  resolution?: string;
  engineer?: string;
  memo?: string;
  created_by: string;
}

export async function createIncidentLog(
  supabase: SupabaseClient,
  input: CreateIncidentLogInput
): Promise<IncidentLog> {
  const { data, error } = await supabase.from('incident_logs').insert(input).select('*').single();
  if (error) throw error;
  return data as IncidentLog;
}
