'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import {
  createIpPhoneExtension,
  deleteIpPhoneExtension,
  type CreateIpPhoneExtensionInput,
} from '@/lib/data-access/ip-phone-extensions';
import {
  createServiceCredential,
  deleteServiceCredential,
  revealServiceCredentialPassword,
  type CreateServiceCredentialInput,
} from '@/lib/data-access/service-credentials';

async function requireActivationAccess() {
  const session = await getSessionContext();
  if (!session || (session.role !== 'master' && session.role !== 'activation_dept')) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createIpPhoneExtensionAction(
  input: Omit<CreateIpPhoneExtensionInput, 'created_by'>
) {
  const session = await requireActivationAccess();
  const supabase = await createClient();
  const extension = await createIpPhoneExtension(supabase, { ...input, created_by: session.userId });
  revalidatePath('/activations');
  return extension;
}

export async function deleteIpPhoneExtensionAction(id: string) {
  await requireActivationAccess();
  const supabase = await createClient();
  await deleteIpPhoneExtension(supabase, id);
  revalidatePath('/activations');
}

export async function createServiceCredentialAction(
  input: Omit<CreateServiceCredentialInput, 'created_by'>
) {
  const session = await requireActivationAccess();
  const supabase = await createClient();
  const credential = await createServiceCredential(supabase, { ...input, created_by: session.userId });
  revalidatePath('/activations');
  return credential;
}

export async function deleteServiceCredentialAction(id: string) {
  await requireActivationAccess();
  const supabase = await createClient();
  await deleteServiceCredential(supabase, id);
  revalidatePath('/activations');
}

export async function revealServiceCredentialPasswordAction(id: string) {
  const session = await requireActivationAccess();
  const supabase = await createClient();
  return revealServiceCredentialPassword(supabase, id, session.role);
}
