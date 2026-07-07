'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { createCustomer, updateCustomer, type CreateCustomerInput, type UpdateCustomerInput } from '@/lib/data-access/customers';

export async function createCustomerAction(input: Omit<CreateCustomerInput, 'created_by'>) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const customer = await createCustomer(supabase, { ...input, created_by: session.userId });
  revalidatePath('/customers');
  return customer;
}

export async function updateCustomerAction(code: string, input: UpdateCustomerInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const customer = await updateCustomer(supabase, code, input);
  revalidatePath('/customers');
  revalidatePath(`/customers/${code}`);
  return customer;
}
