import type { EquipmentCatalogItem, EquipmentSelection, QuoteRowRecord } from '@/types/domain';
import type { QuoteCalcResult } from '@/lib/calc/quote-calc';

/** What the client submits — just the pick + quantity. The server always
 * resolves catalogId against the current catalog itself (model name, spec,
 * rate, cost) rather than trusting anything the client echoes back, the
 * same way core pricing is never trusted from the client either. */
export interface EquipmentSelectionRequest {
  catalogId: string;
  qty: number;
  /** Extra units used this period (e.g. pages printed), only meaningful for
   * catalog items with an overage_rate set. */
  overageQty?: number;
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
        overageQty: r.overageQty ?? 0,
        overageRate: item.overage_rate,
        overageCost: item.overage_cost,
      };
    })
    .filter((s): s is EquipmentSelection => s !== null);
}

/** Only models with a monthly_rate set become a priced line — everything
 * else stays purely informational (rendered only in the quote document's
 * spec table, per the original equipment-catalog feature). A selection with
 * overage usage gets a second row for that amount, kept separate from the
 * flat rental line so the breakdown is transparent on the quote document
 * (e.g. "HP LaserJet M15w" base line + "HP LaserJet M15w 추가 인쇄 120장"). */
export function equipmentPricedRows(selections: EquipmentSelection[]): QuoteRowRecord[] {
  const rows: QuoteRowRecord[] = [];
  for (const s of selections) {
    if (s.monthlyRate != null) {
      rows.push({
        key: `equipment:${s.catalogId}`,
        label: s.qty > 1 ? `${s.modelName} × ${s.qty}` : s.modelName,
        amount: s.monthlyRate * s.qty,
        cost: (s.monthlyCost ?? 0) * s.qty,
        init: 0,
        commissionable: true,
      });
    }
    if (s.overageQty > 0 && s.overageRate != null) {
      rows.push({
        key: `equipment-overage:${s.catalogId}`,
        label: `${s.modelName} 추가 사용량 ${s.overageQty}`,
        amount: s.overageRate * s.overageQty,
        cost: (s.overageCost ?? 0) * s.overageQty,
        init: 0,
        commissionable: true,
      });
    }
  }
  return rows;
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
