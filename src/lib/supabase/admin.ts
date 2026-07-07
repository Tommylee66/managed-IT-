import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client for privileged Auth Admin API calls (password reset,
 * account creation/deactivation). Server-only — never import from client code.
 * Callers MUST verify the caller is an active `master` via the normal
 * cookie-authed server client BEFORE using this.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
