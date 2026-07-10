import type { EquipmentCatalogItem, EquipmentSelection, QuoteRowRecord } from '@/types/domain';
import type { QuoteCalcResult } from '@/lib/calc/quote-calc';

/** What the client submits — just the pick + quantity. The server always
 * resolves catalogId against the current catalog itself (model name, spec,
 * rate, cost) rather than trusting anything the client echoes back, the
 * same way core pricing is never trusted from the client either. */
export interface EquipmentSelectionRequest {
  catalogId: string;
  qty: number;
}

export function resolveEquipmentSelections(
  requests: EquipmentSelectionRequest[],
  catalog: EquipmentCatalogItem[]
): EquipmentSelection[] {
  return requests
    .map((r): EquipmentSelection | null => {
      const item = catalog.find((c) => c.id === r.catalogId);
      if (!item) return null;
      return {
        catalogId: item.id,
        category: item.category,
        modelName: item.model_name,
        specId: item.spec_id,
        specKo: item.spec_ko,
        qty: r.qty,
        monthlyRate: item.monthly_rate,
        monthlyCost: item.monthly_cost,
      };
    })
    .filter((s): s is EquipmentSelection => s !== null);
}

/** Only models with a monthly_rate set become a priced line — everything
 * else stays purely informational (rendered only in the quote document's
 * spec table, per the original equipment-catalog feature). */
export function equipmentPricedRows(selections: EquipmentSelection[]): QuoteRowRecord[] {
  return selections
    .filter((s) => s.monthlyRate != null)
    .map((s) => ({
      key: `equipment:${s.catalogId}`,
      label: s.modelName,
      amount: (s.monthlyRate ?? 0) * s.qty,
      cost: (s.monthlyCost ?? 0) * s.qty,
      init: 0,
      commissionable: true,
    }));
}

/** Folds priced equipment rows into an already-computed quote/change-request
 * calc — equipment rental has no init/amortization component, so only
 * monthly/monthlyCost/totalCost/margin/commissionBase shift. */
export function mergeEquipmentIntoCalc(
  calc: QuoteCalcResult,
  selections: EquipmentSelection[]
): QuoteCalcResult {
  const rows = equipmentPricedRows(selections);
  if (rows.length === 0) return calc;

  const equipMonthly = rows.reduce((sum, r) => sum + r.amount, 0);
  const equipCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const monthly = calc.monthly + equipMonthly;
  const monthlyCost = calc.monthlyCost + equipCost;
  const totalCost = monthlyCost + calc.amort;
  const margin = monthly ? ((monthly - totalCost) / monthly) * 100 : 0;
  const commissionBase = calc.commissionBase + equipMonthly;

  return {
    ...calc,
    rows: [...calc.rows, ...rows],
    monthly,
    monthlyCost,
    totalCost,
    margin,
    commissionBase,
  };
}
