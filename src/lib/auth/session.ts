import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { StaffRole } from '@/lib/masking/staff-masking';

export interface SessionContext {
  userId: string;
  email: string | null;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  isApproved: boolean;
}

/**
 * Returns null if there's no authenticated user or no matching active profile.
 *
 * Wrapped in React's request-level cache so that the layout and page (and any
 * other server components in the same render) share a single Supabase
 * getUser() call. Without this, concurrent independent calls can each try to
 * refresh the same one-time-use refresh token, and the loser fails with
 * "Invalid Refresh Token" — surfacing as a random, hard-to-reproduce null
 * session right after login.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active, is_approved')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
    isApproved: profile.is_approved,
  };
});

export async function requireMaster(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session || session.role !== 'master' || !session.isActive) {
    throw new Error('Forbidden: master role required');
  }
  return session;
}
