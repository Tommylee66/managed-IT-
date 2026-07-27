import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceCredential, ServiceCredentialCategory } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { encryptCredential, decryptCredential, type EncryptedPayload } from '@/lib/crypto/credential-encryption';

interface ServiceCredentialRow {
  id: string;
  customer_code: string;
  service_name: string;
  category: ServiceCredentialCategory;
  login_id: string | null;
  password_encrypted: EncryptedPayload | null;
  url: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** The plaintext password never leaves this module — list/detail reads only
 * ever surface `has_password`. Callers that need the actual value must go
 * through `revealServiceCredentialPassword`, which re-checks the role
 * itself rather than trusting whatever role the caller claims. */
function toServiceCredential(row: ServiceCredentialRow): ServiceCredential {
  const { password_encrypted, ...rest } = row;
  return { ...rest, has_password: password_encrypted != null };
}

export async function listServiceCredentialsByCustomer(
  supabase: SupabaseClient,
  customerCode: string
): Promise<ServiceCredential[]> {
  const { data, error } = await supabase
    .from('service_credentials')
    .select('*')
    .eq('customer_code', customerCode)
    .order('service_name');
  if (error) throw error;
  return (data as ServiceCredentialRow[]).map(toServiceCredential);
}

export interface CreateServiceCredentialInput {
  customer_code: string;
  service_name: string;
  category: ServiceCredentialCategory;
  login_id?: string | null;
  /** Plaintext — encrypted before it ever reaches the database. */
  password?: string | null;
  url?: string | null;
  memo?: string | null;
  created_by: string;
}

export async function createServiceCredential(
  supabase: SupabaseClient,
  input: CreateServiceCredentialInput
): Promise<ServiceCredential> {
  const { data, error } = await supabase
    .from('service_credentials')
    .insert({
      customer_code: input.customer_code,
      service_name: input.service_name,
      category: input.category,
      login_id: input.login_id ?? null,
      password_encrypted: input.password ? encryptCredential(input.password) : null,
      url: input.url ?? null,
      memo: input.memo ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toServiceCredential(data as ServiceCredentialRow);
}

export async function deleteServiceCredential(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('service_credentials').delete().eq('id', id);
  if (error) throw error;
}

/** Decrypts and returns the plaintext password for one credential — the
 * only function in the app that ever does this. Re-checks the role itself
 * (rather than trusting a caller-supplied role) since this is the actual
 * security boundary, not just a display-masking convenience. */
export async function revealServiceCredentialPassword(
  supabase: SupabaseClient,
  id: string,
  role: StaffRole
): Promise<string | null> {
  if (role !== 'master' && role !== 'activation_dept') {
    throw new Error('Unauthorized');
  }
  const { data, error } = await supabase
    .from('service_credentials')
    .select('password_encrypted')
    .eq('id', id)
    .single();
  if (error) throw error;
  const row = data as { password_encrypted: EncryptedPayload | null };
  return row.password_encrypted ? decryptCredential(row.password_encrypted) : null;
}
