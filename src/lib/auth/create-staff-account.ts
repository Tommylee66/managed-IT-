import { randomInt } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StaffRole } from '@/types/domain';
import { MAX_MASTER_ACCOUNTS } from '@/lib/auth/constants';

// Excludes visually ambiguous characters (I/l/1, O/0) since a generated
// password may need to be read aloud or retyped by hand.
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTempPassword(length = 12): string {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

export interface CreateStaffAccountInput {
  email: string;
  password: string;
  full_name: string;
  role: StaffRole;
  agent_code?: string | null;
}

export interface CreatedStaffAccount {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
}

/** Shared by the staff-admin "create account" API route and the
 * auto-registration triggered from agent creation. `supabase` must be a
 * normal cookie-authed client (used for the profiles/audit_log writes);
 * this function creates its own admin client internally for the
 * privileged auth.admin.createUser call. Caller must have already
 * verified the acting user is an active `master`. */
export async function createStaffAccount(
  supabase: SupabaseClient,
  createdByUserId: string,
  input: CreateStaffAccountInput
): Promise<CreatedStaffAccount> {
  const { email, password, full_name, role, agent_code } = input;

  if (role === 'master') {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'master')
      .eq('is_active', true);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_MASTER_ACCOUNTS) {
      // Callers translate this stable code (see roleChangeErrorMaxMaster in
      // messages/*.json) rather than displaying a hardcoded-locale message.
      throw new Error('MAX_MASTER_ACCOUNTS');
    }
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, pre_approved: true },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? 'Failed to create user');
  }

  // handle_new_user always inserts the profile as admin_dept — apply the
  // requested role (and, for sales_agent, the linked agent) here.
  if (role !== 'admin_dept') {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role, agent_code: role === 'sales_agent' ? (agent_code ?? null) : null })
      .eq('id', created.user.id);
    if (roleError) throw roleError;
  }

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_CREATED',
    p_target_table: 'profiles',
    p_target_id: created.user.id,
    p_details: { email, role, created_by: createdByUserId },
  });

  return { id: created.user.id, email, full_name, role };
}
