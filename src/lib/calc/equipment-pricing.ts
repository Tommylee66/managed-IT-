import type { EquipmentCatalogItem, EquipmentSelection, QuoteRowRecord } from '@/types/domain';
import type { QuoteCalcResult } from '@/lib/calc/quote-calc';

/** What the client submits — just the pick + quantity. The server always
 * resolves catalogId against the current catalog itself (model name, spec,
 * rate, cost) rather than trusting anything the client echoes back, the
 * same way core pricing is never trusted from the client either. */
export interface EquipmentSelectionRequest {
  catalogId: string;
  qty: number;
  /** Units used this period (e.g. pages printed) — the raw figure, before
   * the item's included allowance is deducted. Only meaningful for catalog
   * items with an overage_rate set. */
  overageQty?: number;
  /** Color units used this period, for color printers only (an item with a
   * color_overage_rate). Mono usage stays in overageQty. */
  colorOverageQty?: number;
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
        spec: item.spec,
        qty: r.qty,
        monthlyRate: item.monthly_rate,
        monthlyCost: item.monthly_cost,
        overageQty: r.overageQty ?? 0,
        overageRate: item.overage_rate,
        overageCost: item.overage_cost,
        includedQty: item.included_qty ?? 0,
        colorOverageQty: r.colorOverageQty ?? 0,
        colorIncludedQty: item.color_included_qty ?? 0,
        colorOverageRate: item.color_overage_rate,
        colorOverageCost: item.color_overage_cost,
        commissionRateOverride: item.commission_rate_override,
      };
    })
    .filter((s): s is EquipmentSelection => s !== null);
}

/** True when color pages are priced on their own tier, which also makes the
 * plain overage fields mean "mono" rather than "all pages". Takes the two
 * values rather than a record so it reads the same off a catalog item
 * (color_overage_rate/color_included_qty) and off a stored selection
 * (colorOverageRate/colorIncludedQty). */
export function isColorTiered(
  colorRate: number | null | undefined,
  colorIncluded: number | null | undefined
): boolean {
  return colorRate != null || (colorIncluded ?? 0) > 0;
}

/** The allowance is defined per rented unit, so renting three printers that
 * each include 500 pages covers 1,500 pages before anything is billable —
 * consistent with the flat rental line, which is also per unit x qty. */
export function includedAllowance(includedQty: number | undefined, qty: number): number {
  return (includedQty ?? 0) * Math.max(1, qty);
}

export function billableOverage(
  usedQty: number | undefined,
  includedQty: number | undefined,
  qty: number
): number {
  return Math.max(0, (usedQty ?? 0) - includedAllowance(includedQty, qty));
}

/** modelName is a product model name (not itself locale-specific), so only
 * the usage wording needs a bilingual pair — same pattern as
 * service-pricing.ts's labelId/labelKo rows. The allowance breakdown is
 * appended only when there is an allowance, which keeps the label of an
 * item without one byte-identical to what it was before allowances
 * existed. `tier` is omitted entirely on a mono-only item, where splitting
 * the wording into "mono"/"color" would be noise (and wrong for the
 * non-printer categories that can also carry an overage rate). */
function overageLabels(
  s: EquipmentSelection,
  billable: number,
  allowance: number,
  tier: 'mono' | 'color' | null
): { labelKo: string; labelId: string } {
  const tierKo = tier === 'mono' ? ' 흑백' : tier === 'color' ? ' 컬러' : '';
  const tierId = tier === 'mono' ? ' Hitam Putih' : tier === 'color' ? ' Warna' : '';
  const usedQty = tier === 'color' ? (s.colorOverageQty ?? 0) : s.overageQty;
  const breakdownKo = allowance > 0 ? ` (사용 ${usedQty} − 무상 ${allowance})` : '';
  const breakdownId = allowance > 0 ? ` (pakai ${usedQty} − gratis ${allowance})` : '';
  return {
    labelKo: `${s.modelName}${tierKo} 추가 사용량 ${billable}${breakdownKo}`,
    labelId: `${s.modelName}${tierId} Pemakaian Tambahan ${billable}${breakdownId}`,
  };
}

/** Only models with a monthly_rate set become a priced line — everything
 * else stays purely informational (rendered only in the quote document's
 * spec table, per the original equipment-catalog feature). Usage beyond the
 * item's included allowance gets its own row (a color printer gets one per
 * tier), kept separate from the flat rental line so the breakdown is
 * transparent on the quote document (e.g. "HP LaserJet M15w" base line +
 * "HP LaserJet M15w 흑백 추가 사용량 120 (사용 620 − 무상 500)"). */
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
        commissionRate: s.commissionRateOverride ?? null,
      });
    }

    const colorTiered = isColorTiered(s.colorOverageRate, s.colorIncludedQty);

    const monoAllowance = includedAllowance(s.includedQty, s.qty);
    const monoBillable = billableOverage(s.overageQty, s.includedQty, s.qty);
    if (monoBillable > 0 && s.overageRate != null) {
      const { labelKo, labelId } = overageLabels(
        s,
        monoBillable,
        monoAllowance,
        colorTiered ? 'mono' : null
      );
      rows.push({
        key: `equipment-overage:${s.catalogId}`,
        label: labelKo,
        labelId,
        labelKo,
        amount: s.overageRate * monoBillable,
        cost: (s.overageCost ?? 0) * monoBillable,
        init: 0,
        commissionable: true,
        commissionRate: s.commissionRateOverride ?? null,
      });
    }

    const colorAllowance = includedAllowance(s.colorIncludedQty, s.qty);
    const colorBillable = billableOverage(s.colorOverageQty, s.colorIncludedQty, s.qty);
    if (colorBillable > 0 && s.colorOverageRate != null) {
      const { labelKo, labelId } = overageLabels(s, colorBillable, colorAllowance, 'color');
      rows.push({
        key: `equipment-overage-color:${s.catalogId}`,
        label: labelKo,
        labelId,
        labelKo,
        amount: s.colorOverageRate * colorBillable,
        cost: (s.colorOverageCost ?? 0) * colorBillable,
        init: 0,
        commissionable: true,
        commissionRate: s.commissionRateOverride ?? null,
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
