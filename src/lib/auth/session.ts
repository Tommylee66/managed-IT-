import { createClient } from '@/lib/supabase/server';
import type { StaffRole } from '@/lib/masking/staff-masking';

export interface SessionContext {
  userId: string;
  email: string | null;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
}

/** Returns null if there's no authenticated user or no matching active profile. */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
  };
}

export async function requireMaster(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session || session.role !== 'master' || !session.isActive) {
    throw new Error('Forbidden: master role required');
  }
  return session;
}
