import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssetType, EquipmentCatalogItem } from '@/types/domain';

export async function listEquipmentCatalog(
  supabase: SupabaseClient,
  { activeOnly = false }: { activeOnly?: boolean } = {}
): Promise<EquipmentCatalogItem[]> {
  let query = supabase.from('equipment_catalog').select('*').order('category').order('model_name');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data as EquipmentCatalogItem[];
}

export interface CreateEquipmentInput {
  category: AssetType;
  model_name: string;
  spec_id?: string;
  spec_ko?: string;
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
