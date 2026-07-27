import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpPhoneExtension, IpPhoneDeviceType } from '@/types/domain';

export async function listIpPhoneExtensionsByCustomer(
  supabase: SupabaseClient,
  customerCode: string
): Promise<IpPhoneExtension[]> {
  const { data, error } = await supabase
    .from('ip_phone_extensions')
    .select('*')
    .eq('customer_code', customerCode)
    .order('employee_name');
  if (error) throw error;
  return data as IpPhoneExtension[];
}

export interface CreateIpPhoneExtensionInput {
  customer_code: string;
  employee_name: string;
  extension_number: string;
  device_type: IpPhoneDeviceType;
  memo?: string | null;
  created_by: string;
}

export async function createIpPhoneExtension(
  supabase: SupabaseClient,
  input: CreateIpPhoneExtensionInput
): Promise<IpPhoneExtension> {
  const { data, error } = await supabase
    .from('ip_phone_extensions')
    .insert({
      customer_code: input.customer_code,
      employee_name: input.employee_name,
      extension_number: input.extension_number,
      device_type: input.device_type,
      memo: input.memo ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as IpPhoneExtension;
}

export async function deleteIpPhoneExtension(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('ip_phone_extensions').delete().eq('id', id);
  if (error) throw error;
}
