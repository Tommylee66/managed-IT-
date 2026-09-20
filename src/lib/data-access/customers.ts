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

/** See anonymizeAgent. Clears the individual contact behind the company,
 * keeps the company's own name and tax id (not personal data, and named on
 * tax documents that must stay readable), and drops their staff's phone
 * extensions and system credentials outright. */
export async function anonymizeCustomer(supabase: SupabaseClient, code: string): Promise<void> {
  const { error } = await supabase.rpc('anonymize_customer', { p_code: code });
  if (error) throw error;
}

/** Everything held about one customer, for the data-portability right. */
export async function exportCustomerPersonalData(
  supabase: SupabaseClient,
  code: string
): Promise<Record<string, unknown>> {
  const [customer, contracts, invoices, extensions] = await Promise.all([
    supabase.from('customers').select('*').eq('code', code).single(),
    supabase.from('contracts').select('no, start_date, months, status, created_at').eq('customer_code', code),
    supabase.from('invoices').select('no, month, total, paid_at, created_at').eq('customer_code', code),
    supabase.from('ip_phone_extensions').select('employee_name, extension_number, device_type').eq('customer_code', code),
  ]);
  for (const r of [customer, contracts, invoices, extensions]) {
    if (r.error) throw r.error;
  }

  return {
    exported_at: new Date().toISOString(),
    subject: { type: 'customer', code },
    customer: customer.data,
    contracts: contracts.data,
    invoices: invoices.data,
    phone_extensions: extensions.data,
  };
}
