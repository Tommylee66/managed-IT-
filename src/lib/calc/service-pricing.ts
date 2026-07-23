import type { ServiceCatalogItem, ServiceSelection, QuoteRowRecord } from '@/types/domain';
import type { QuoteCalcResult } from '@/lib/calc/quote-calc';

/** What the client submits — just the pick + quantity. The server always
 * resolves catalogId against the current catalog itself (name, rate, cost)
 * rather than trusting anything the client echoes back — same rule as
 * equipment selections. */
export interface ServiceSelectionRequest {
  catalogId: string;
  qty: number;
}

export function resolveServiceSelections(
  requests: ServiceSelectionRequest[],
  catalog: ServiceCatalogItem[]
): ServiceSelection[] {
  return requests
    .map((r): ServiceSelection | null => {
      const item = catalog.find((c) => c.id === r.catalogId);
      if (!item) return null;
      return {
        catalogId: item.id,
        name: item.name,
        description: item.description,
        qty: r.qty,
        monthlyRate: item.monthly_rate,
        monthlyCost: item.monthly_cost,
      };
    })
    .filter((s): s is ServiceSelection => s !== null);
}

/** Only services with a monthly_rate set become a priced line — same rule as
 * equipment. */
export function servicePricedRows(selections: ServiceSelection[]): QuoteRowRecord[] {
  const rows: QuoteRowRecord[] = [];
  for (const s of selections) {
    if (s.monthlyRate != null) {
      rows.push({
        key: `service:${s.catalogId}`,
        label: s.qty > 1 ? `${s.name} × ${s.qty}` : s.name,
        amount: s.monthlyRate * s.qty,
        cost: (s.monthlyCost ?? 0) * s.qty,
        init: 0,
        commissionable: true,
      });
    }
  }
  return rows;
}

/** Folds priced service rows into an already-computed quote/change-request
 * calc — additional services have no init/amortization component, so only
 * monthly/monthlyCost/totalCost/margin/commissionBase shift. */
export function mergeServiceIntoCalc(
  calc: QuoteCalcResult,
  selections: ServiceSelection[]
): QuoteCalcResult {
  const rows = servicePricedRows(selections);
  if (rows.length === 0) return calc;

  const serviceMonthly = rows.reduce((sum, r) => sum + r.amount, 0);
  const serviceCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const monthly = calc.monthly + serviceMonthly;
  const monthlyCost = calc.monthlyCost + serviceCost;
  const totalCost = monthlyCost + calc.amort;
  const margin = monthly ? ((monthly - totalCost) / monthly) * 100 : 0;
  const commissionBase = calc.commissionBase + serviceMonthly;

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
