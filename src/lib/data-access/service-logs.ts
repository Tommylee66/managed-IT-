import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceLog } from '@/types/domain';
import { nextServiceLogId } from '@/lib/numbering';

export async function listServiceLogsByCustomer(
  supabase: SupabaseClient,
  customerCode: string
): Promise<ServiceLog[]> {
  const { data, error } = await supabase
    .from('service_logs')
    .select('*')
    .eq('customer_code', customerCode)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as ServiceLog[];
}

export async function listAllServiceLogs(supabase: SupabaseClient): Promise<ServiceLog[]> {
  const { data, error } = await supabase
    .from('service_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(300);
  if (error) throw error;
  return data as ServiceLog[];
}

export interface CreateServiceLogInput {
  customer_code: string;
  date: string;
  type: string;
  title?: string;
  memo?: string;
  saved_by: string;
}

export async function createServiceLog(
  supabase: SupabaseClient,
  input: CreateServiceLogInput
): Promise<ServiceLog> {
  const { data, error } = await supabase
    .from('service_logs')
    .insert({ ...input, id: nextServiceLogId() })
    .select('*')
    .single();
  if (error) throw error;
  return data as ServiceLog;
}
