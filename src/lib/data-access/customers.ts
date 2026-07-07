import type { SupabaseClient } from '@supabase/supabase-js';
import type { Customer } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { maskTaxId, maskPhoneNumber, maskEmail } from '@/lib/masking/staff-masking';
import { nextCustomerCode } from '@/lib/numbering';

function applyCustomerMasking(customer: Customer, role: StaffRole): Customer {
  if (role === 'master') return customer;
  return {
    ...customer,
    tax_id: maskTaxId(customer.tax_id),
    phone: maskPhoneNumber(customer.phone),
    email: maskEmail(customer.email),
    invoice_email: maskEmail(customer.invoice_email),
  };
}

export async function listCustomers(
  supabase: SupabaseClient,
  role: StaffRole
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Customer[]).map((c) => applyCustomerMasking(c, role));
}

export async function getCustomer(
  supabase: SupabaseClient,
  code: string,
  role: StaffRole
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return applyCustomerMasking(data as Customer, role);
}

/** Unmasked read for internal use only (e.g. populating an edit form for
 * the record's own data, or generating documents) — never expose this
 * result directly to a `staff`-role response without masking it yourself. */
export async function getCustomerRaw(
  supabase: SupabaseClient,
  code: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data as Customer | null;
}

export interface CreateCustomerInput {
  name: string;
  tax_id?: string;
  contact?: string;
  phone?: string;
  email?: string;
  invoice_email?: string;
  address?: string;
  memo?: string;
  agent_code?: string;
  created_by: string;
}

export async function createCustomer(
  supabase: SupabaseClient,
  input: CreateCustomerInput
): Promise<Customer> {
  const code = await nextCustomerCode(supabase);
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...input, code })
    .select('*')
    .single();
  if (error) throw error;
  return data as Customer;
}

export type UpdateCustomerInput = Partial<
  Omit<CreateCustomerInput, 'created_by'>
> & { status?: Customer['status'] };

export async function updateCustomer(
  supabase: SupabaseClient,
  code: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(input)
    .eq('code', code)
    .select('*')
    .single();
  if (error) throw error;
  return data as Customer;
}
