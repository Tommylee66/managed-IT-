import type { SupabaseClient } from '@supabase/supabase-js';
import type { Quote, ServiceCatalogItem, ServiceSelection } from '@/types/domain';
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
  return items.map((item) => ({
    ...item,
    monthly_cost: null,
    one_time_cost: null,
    commission_rate_override: null,
  }));
}

interface ServiceFields {
  name_id: string;
  name_ko: string;
  description_id?: string | null;
  description_ko?: string | null;
  monthly_rate?: number | null;
  monthly_cost?: number | null;
  one_time_fee?: number | null;
  one_time_cost?: number | null;
  one_time_billing_mode?: 'one_time' | 'monthly';
  commission_rate_override?: number | null;
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
      one_time_fee: input.one_time_fee ?? null,
      one_time_cost: input.one_time_cost ?? null,
      one_time_billing_mode: input.one_time_billing_mode ?? 'one_time',
      commission_rate_override: input.commission_rate_override ?? null,
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
      one_time_fee: input.one_time_fee ?? null,
      one_time_cost: input.one_time_cost ?? null,
      one_time_billing_mode: input.one_time_billing_mode ?? 'one_time',
      commission_rate_override: input.commission_rate_override ?? null,
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

/** service_catalog rows aren't referenced by foreign key — quotes/contracts/
 * change-requests snapshot the selected service's name/rate/cost into their
 * own JSONB columns, so "is this catalog item in use" means scanning those
 * snapshots for a matching catalogId, not a DB-level referential check. */
export async function listUsedServiceCatalogIds(supabase: SupabaseClient): Promise<Set<string>> {
  const [quotes, contracts, changeRequests] = await Promise.all([
    supabase.from('quotes').select('service_selections'),
    supabase.from('contracts').select('quote_snapshot'),
    supabase.from('change_requests').select('old_service_selections, new_service_selections'),
  ]);
  if (quotes.error) throw quotes.error;
  if (contracts.error) throw contracts.error;
  if (changeRequests.error) throw changeRequests.error;

  const ids = new Set<string>();
  for (const row of quotes.data ?? []) {
    for (const sel of (row.service_selections ?? []) as ServiceSelection[]) ids.add(sel.catalogId);
  }
  for (const row of contracts.data ?? []) {
    const snapshot = row.quote_snapshot as Quote | null;
    for (const sel of snapshot?.service_selections ?? []) ids.add(sel.catalogId);
  }
  for (const row of changeRequests.data ?? []) {
    const oldSels = (row.old_service_selections ?? []) as ServiceSelection[];
    const newSels = (row.new_service_selections ?? []) as ServiceSelection[];
    for (const sel of [...oldSels, ...newSels]) ids.add(sel.catalogId);
  }
  return ids;
}

/** Hard delete — rejects if the item is referenced by any existing
 * quote/contract/change-request (see listUsedServiceCatalogIds), so an
 * already-issued document never ends up pointing at a vanished catalog row. */
export async function deleteServiceCatalogItem(supabase: SupabaseClient, id: string): Promise<void> {
  const usedIds = await listUsedServiceCatalogIds(supabase);
  if (usedIds.has(id)) {
    throw new Error('SERVICE_IN_USE');
  }
  const { error } = await supabase.from('service_catalog').delete().eq('id', id);
  if (error) throw error;
}
