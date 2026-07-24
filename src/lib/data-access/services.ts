import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceCatalogItem } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';

/** Staff can see the customer-facing monthly rate (they need it to explain
 * pricing), but never the internal cost — same rule as equipment_catalog. */
export async function listServiceCatalog(
  supabase: SupabaseClient,
  { activeOnly = false, role = 'master' }: { activeOnly?: boolean; role?: StaffRole } = {}
): Promise<ServiceCatalogItem[]> {
  let query = supabase.from('service_catalog').select('*').order('name_id');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  const items = data as ServiceCatalogItem[];
  if (role === 'master') return items;
  return items.map((item) => ({ ...item, monthly_cost: null }));
}

interface ServiceFields {
  name_id: string;
  name_ko: string;
  description_id?: string | null;
  description_ko?: string | null;
  monthly_rate?: number | null;
  monthly_cost?: number | null;
}

export type CreateServiceInput = ServiceFields & { created_by: string };
export type UpdateServiceInput = ServiceFields;

export async function createServiceCatalogItem(
  supabase: SupabaseClient,
  input: CreateServiceInput
): Promise<ServiceCatalogItem> {
  const { data, error } = await supabase
    .from('service_catalog')
    .insert({
      name_id: input.name_id,
      name_ko: input.name_ko,
      description_id: input.description_id ?? null,
      description_ko: input.description_ko ?? null,
      monthly_rate: input.monthly_rate ?? null,
      monthly_cost: input.monthly_cost ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ServiceCatalogItem;
}

/** Only changes the catalog entry itself — quotes/change-requests that
 * already selected this service keep the rate they snapshotted at selection
 * time, so an edit here never changes an already-issued price. */
export async function updateServiceCatalogItem(
  supabase: SupabaseClient,
  id: string,
  input: UpdateServiceInput
): Promise<ServiceCatalogItem> {
  const { data, error } = await supabase
    .from('service_catalog')
    .update({
      name_id: input.name_id,
      name_ko: input.name_ko,
      description_id: input.description_id ?? null,
      description_ko: input.description_ko ?? null,
      monthly_rate: input.monthly_rate ?? null,
      monthly_cost: input.monthly_cost ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ServiceCatalogItem;
}

export async function setServiceCatalogActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean
): Promise<ServiceCatalogItem> {
  const { data, error } = await supabase
    .from('service_catalog')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ServiceCatalogItem;
}

/** Hard delete — safe because quotes/change-requests snapshot the selected
 * service's name/rate/cost at selection time (see ServiceSelection), so
 * nothing references service_catalog rows by foreign key. */
export async function deleteServiceCatalogItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('service_catalog').delete().eq('id', id);
  if (error) throw error;
}
