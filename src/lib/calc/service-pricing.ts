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
        nameId: item.name_id,
        nameKo: item.name_ko,
        descriptionId: item.description_id,
        descriptionKo: item.description_ko,
        qty: r.qty,
        monthlyRate: item.monthly_rate,
        monthlyCost: item.monthly_cost,
        oneTimeFee: item.one_time_fee,
        oneTimeCost: item.one_time_cost,
        oneTimeBillingMode: item.one_time_billing_mode,
        commissionRateOverride: item.commission_rate_override,
      };
    })
    .filter((s): s is ServiceSelection => s !== null);
}

/** Only services with a monthly_rate and/or one_time_fee set become priced
 * lines — same "no rate, no row" rule as equipment. A selection can produce
 * up to two rows: the normal recurring row (monthly_rate), and a one-time-fee
 * row whose shape depends on billing mode — spread evenly into a recurring
 * "installment" row (`monthly` mode), or a separate non-recurring row marked
 * `oneTime: true` (`one_time` mode, the default). */
export function servicePricedRows(selections: ServiceSelection[], months: number): QuoteRowRecord[] {
  const rows: QuoteRowRecord[] = [];
  for (const s of selections) {
    if (s.monthlyRate != null) {
      rows.push({
        key: `service:${s.catalogId}`,
        label: s.qty > 1 ? `${s.nameId} × ${s.qty}` : s.nameId,
        labelId: s.qty > 1 ? `${s.nameId} × ${s.qty}` : s.nameId,
        labelKo: s.qty > 1 ? `${s.nameKo} × ${s.qty}` : s.nameKo,
        amount: s.monthlyRate * s.qty,
        cost: (s.monthlyCost ?? 0) * s.qty,
        init: 0,
        commissionable: true,
        commissionRate: s.commissionRateOverride ?? null,
      });
    }
    if (s.oneTimeFee != null) {
      if (s.oneTimeBillingMode === 'monthly' && months > 0) {
        const labelId = `${s.nameId} — Cicilan Biaya Konstruksi (${months} bln)`;
        const labelKo = `${s.nameKo} — 공사비 분할납부 (${months}개월)`;
        rows.push({
          key: `service-onetime-installment:${s.catalogId}`,
          label: labelKo,
          labelId,
          labelKo,
          amount: (s.oneTimeFee * s.qty) / months,
          cost: ((s.oneTimeCost ?? 0) * s.qty) / months,
          init: 0,
          commissionable: true,
          commissionRate: s.commissionRateOverride ?? null,
        });
      } else {
        const labelId = `${s.nameId} (Biaya Konstruksi — Tagihan 1x)`;
        const labelKo = `${s.nameKo} (공사 대금 — 1회 청구)`;
        rows.push({
          key: `service-onetime:${s.catalogId}`,
          label: labelKo,
          labelId,
          labelKo,
          amount: s.oneTimeFee * s.qty,
          cost: (s.oneTimeCost ?? 0) * s.qty,
          init: 0,
          commissionable: false,
          oneTime: true,
        });
      }
    }
  }
  return rows;
}

/** Folds priced service rows into an already-computed quote/change-request
 * calc. Recurring rows shift monthly/monthlyCost/totalCost/margin/
 * commissionBase as before; `oneTime` rows are appended to `rows` (so
 * documents/preview can render them) but deliberately excluded from every
 * recurring monthly figure — they're a separate one-off charge, not part of
 * the contract's ongoing monthly bill. */
export function mergeServiceIntoCalc(
  calc: QuoteCalcResult,
  selections: ServiceSelection[],
  months: number
): QuoteCalcResult {
  const rows = servicePricedRows(selections, months);
  if (rows.length === 0) return calc;

  const recurringRows = rows.filter((r) => !r.oneTime);
  const serviceMonthly = recurringRows.reduce((sum, r) => sum + r.amount, 0);
  const serviceCost = recurringRows.reduce((sum, r) => sum + r.cost, 0);
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
