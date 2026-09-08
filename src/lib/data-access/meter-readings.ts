import type { SupabaseClient } from '@supabase/supabase-js';
import type { MeterReading } from '@/types/domain';
import type { MeteredUsage } from '@/lib/calc/equipment-pricing';

export async function listMeterReadingsByContractMonth(
  supabase: SupabaseClient,
  contractNo: string,
  month: string
): Promise<MeterReading[]> {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('contract_no', contractNo)
    .eq('month', month);
  if (error) throw error;
  return data as MeterReading[];
}

/** Every reading for a month across the given contracts, in one round trip —
 * used when invoicing or listing a whole month's billables, where fetching
 * per contract would be a query per row. */
export async function listMeterReadingsForContracts(
  supabase: SupabaseClient,
  contractNos: string[],
  month: string
): Promise<MeterReading[]> {
  if (contractNos.length === 0) return [];
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('month', month)
    .in('contract_no', contractNos);
  if (error) throw error;
  return data as MeterReading[];
}

export async function listMeterReadingsByCustomerMonth(
  supabase: SupabaseClient,
  customerCode: string,
  month: string
): Promise<MeterReading[]> {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('customer_code', customerCode)
    .eq('month', month);
  if (error) throw error;
  return data as MeterReading[];
}

/** Readings keyed by catalog id, the shape withMeteredUsage consumes. */
export function usageByCatalogId(readings: MeterReading[]): Map<string, MeteredUsage> {
  return new Map(
    readings.map((r) => [
      r.catalog_id,
      { monoQty: Number(r.mono_qty ?? 0), colorQty: Number(r.color_qty ?? 0) },
    ])
  );
}

export interface MeterReadingInput {
  catalog_id: string;
  mono_qty: number;
  color_qty: number;
  reading_date?: string | null;
  engineer?: string | null;
  memo?: string | null;
}

/** Records a month's readings for one contract in a single upsert, so
 * re-entering a month corrects the existing rows rather than adding a
 * second set that would double-bill (see the unique constraint on
 * contract_no/catalog_id/month).
 *
 * An entry is deleted rather than stored when both counts are zero: a blank
 * row would otherwise read as "metered, printed nothing" and bill zero,
 * which is a different claim from "not read this month" — and only the
 * latter should fall back to the quoted estimate. */
export async function saveMeterReadings(
  supabase: SupabaseClient,
  contractNo: string,
  customerCode: string,
  month: string,
  entries: MeterReadingInput[],
  createdBy: string
): Promise<MeterReading[]> {
  const blank = entries.filter((e) => !e.mono_qty && !e.color_qty);
  const filled = entries.filter((e) => e.mono_qty || e.color_qty);

  if (blank.length) {
    const { error } = await supabase
      .from('meter_readings')
      .delete()
      .eq('contract_no', contractNo)
      .eq('month', month)
      .in(
        'catalog_id',
        blank.map((e) => e.catalog_id)
      );
    if (error) throw error;
  }

  if (!filled.length) return [];

  const { data, error } = await supabase
    .from('meter_readings')
    .upsert(
      filled.map((e) => ({
        contract_no: contractNo,
        customer_code: customerCode,
        catalog_id: e.catalog_id,
        month,
        mono_qty: e.mono_qty,
        color_qty: e.color_qty,
        reading_date: e.reading_date ?? null,
        engineer: e.engineer ?? null,
        memo: e.memo ?? null,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'contract_no,catalog_id,month' }
    )
    .select('*');
  if (error) throw error;
  return data as MeterReading[];
}

/** Every reading for the given contracts across all months, as the lookup
 * the commission calcs consume (`${contractNo}:${month}` -> catalog id ->
 * usage). Unbounded by month on purpose: an agent's commission history
 * walks every month since their contract started, so a month-filtered
 * fetch would silently fall back to the quoted estimate for older months
 * that do have readings. */
export async function meterUsageLookupForContracts(
  supabase: SupabaseClient,
  contractNos: string[]
): Promise<Map<string, Map<string, MeteredUsage>>> {
  const lookup = new Map<string, Map<string, MeteredUsage>>();
  if (contractNos.length === 0) return lookup;

  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .in('contract_no', contractNos);
  if (error) throw error;

  for (const r of data as MeterReading[]) {
    const key = `${r.contract_no}:${r.month}`;
    const byCatalog = lookup.get(key) ?? new Map<string, MeteredUsage>();
    byCatalog.set(r.catalog_id, {
      monoQty: Number(r.mono_qty ?? 0),
      colorQty: Number(r.color_qty ?? 0),
    });
    lookup.set(key, byCatalog);
  }
  return lookup;
}
