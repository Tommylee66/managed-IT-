import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssetType, EquipmentCatalogItem } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';

/** Staff can see the customer-facing monthly rate (they need it to explain
 * pricing), but never the internal cost/purchase price — those reveal
 * margin, same rule as rates.cost_fields. */
export async function listEquipmentCatalog(
  supabase: SupabaseClient,
  { activeOnly = false, role = 'master' }: { activeOnly?: boolean; role?: StaffRole } = {}
): Promise<EquipmentCatalogItem[]> {
  let query = supabase.from('equipment_catalog').select('*').order('category').order('model_name');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  const items = data as EquipmentCatalogItem[];
  if (role === 'master') return items;
  return items.map((item) => ({
    ...item,
    monthly_cost: null,
    purchase_price: null,
    overage_cost: null,
  }));
}

interface EquipmentFields {
  category: AssetType;
  model_name: string;
  spec_id?: string;
  spec_ko?: string;
  purchase_price?: number | null;
  monthly_rate?: number | null;
  monthly_cost?: number | null;
  overage_rate?: number | null;
  overage_cost?: number | null;
}

export type CreateEquipmentInput = EquipmentFields & { created_by: string };
export type UpdateEquipmentInput = EquipmentFields;

export async function createEquipmentCatalogItem(
  supabase: SupabaseClient,
  input: CreateEquipmentInput
): Promise<EquipmentCatalogItem> {
  const { data, error } = await supabase
    .from('equipment_catalog')
    .insert({
      category: input.category,
      model_name: input.model_name,
      spec_id: input.spec_id ?? null,
      spec_ko: input.spec_ko ?? null,
      purchase_price: input.purchase_price ?? null,
      monthly_rate: input.monthly_rate ?? null,
      monthly_cost: input.monthly_cost ?? null,
      overage_rate: input.overage_rate ?? null,
      overage_cost: input.overage_cost ?? null,
      created_by: input.created_by,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as EquipmentCatalogItem;
}

/** Only changes the catalog entry itself — quotes/change-requests that
 * already selected this model keep the rate/spec they snapshotted at
 * selection time, so an edit here never changes an already-issued price. */
export async function updateEquipmentCatalogItem(
  supabase: SupabaseClient,
  id: string,
  input: UpdateEquipmentInput
): Promise<EquipmentCatalogItem> {
  const { data, error } = await supabase
    .from('equipment_catalog')
    .update({
      category: input.category,
      model_name: input.model_name,
      spec_id: input.spec_id ?? null,
      spec_ko: input.spec_ko ?? null,
      purchase_price: input.purchase_price ?? null,
      monthly_rate: input.monthly_rate ?? null,
      monthly_cost: input.monthly_cost ?? null,
      overage_rate: input.overage_rate ?? null,
      overage_cost: input.overage_cost ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as EquipmentCatalogItem;
}

export async function setEquipmentCatalogActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean
): Promise<EquipmentCatalogItem> {
  const { data, error } = await supabase
    .from('equipment_catalog')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as EquipmentCatalogItem;
}
