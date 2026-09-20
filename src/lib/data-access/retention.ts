import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetentionKey, RetentionPolicy, RetentionPreview } from '@/types/domain';

export async function listRetentionPolicies(supabase: SupabaseClient): Promise<RetentionPolicy[]> {
  const { data, error } = await supabase.from('retention_policies').select('*').order('key');
  if (error) throw error;
  return data as RetentionPolicy[];
}

/** Policies plus the row counts a purge would affect — master-only, enforced
 * in Postgres. Shown before running one, since the purge cannot be undone. */
export async function previewRetention(supabase: SupabaseClient): Promise<RetentionPreview[]> {
  const { data, error } = await supabase.rpc('preview_data_retention');
  if (error) throw error;
  return (data as RetentionPreview[]).map((r) => ({ ...r, affected: Number(r.affected) }));
}

export async function updateRetentionPolicy(
  supabase: SupabaseClient,
  key: RetentionKey,
  input: { months: number; enabled: boolean },
  updatedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('retention_policies')
    .update({ ...input, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('key', key);
  if (error) throw error;
}

/** Applies every enabled policy. Returns rows removed per category. */
export async function purgeExpiredPersonalData(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('purge_expired_personal_data');
  if (error) throw error;
  return (data ?? {}) as Record<string, number>;
}
