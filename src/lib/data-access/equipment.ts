import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssetType, EquipmentCatalogItem } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';

/** Staff can see the customer-facing monthly rate (they need it to explain
 * pricing), but never the internal cost — that reveals margin, same rule as
 * rates.cost_fields. */
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
  return items.map((item) => ({ ...item, monthly_cost: null }));
}

export interface CreateEquipmentInput {
  category: AssetType;
  model_name: string;
  spec_id?: string;
  spec_ko?: string;
  monthly_rate?: number | null;
  monthly_cost?: number | null;
  created_by: string;
}

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
      monthly_rate: input.monthly_rate ?? null,
      monthly_cost: input.monthly_cost ?? null,
      created_by: input.created_by,
    })
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
