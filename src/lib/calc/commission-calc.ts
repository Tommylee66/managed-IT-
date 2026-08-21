import { addMonths, addDays, format } from 'date-fns';
import type { QuoteRowRecord } from '@/types/domain';

// Agent earns 100% commission for the full contract duration, then 50% for
// as long as the customer keeps using the service afterward — no fixed
// cutoff (see agent-agreement-clauses.ts clause 3.2). This used to stop
// after an equal further duration (1.5x total), which the business has
// since decided against.

export interface CommissionCalcResult {
  monthlyCommission: number;
  halfMonthlyCommission: number;
  commissionFullEnd: string;
  commissionHalfStart: string;
  totalCommission: number;
}

/** Which rows in a given month's bill actually count toward commission.
 * One-time fee rows never count — they're a single lump-sum charge, not
 * part of the recurring bill (matching mergeServiceIntoCalc's own exclusion
 * of `oneTime` rows from commissionBase). Equipment/service rows (dynamic
 * catalog-item keys) otherwise always count, matching the unconditional
 * behavior of mergeEquipmentIntoCalc/mergeServiceIntoCalc. The static
 * config-driven rows (base/employee/cctv/term/visit/location/vpn/security/
 * ap/hub) are gated by the admin-configurable commissionItems map — except
 * 'discount', which is never toggleable: a temporary discount is a real
 * reduction in what's actually billed, not an optional add-on whose
 * commission-eligibility is a business choice, so it always applies (a
 * negative-amount row being "excluded" would otherwise inflate the base
 * instead of reducing it). Used both by quote-calc.ts (the quote-stage
 * estimate) and commission-report.ts (the live per-invoice-month figure). */
export function computeCommissionBase(
  rows: QuoteRowRecord[],
  commissionItems: Record<string, boolean>
): number {
  return rows.reduce((sum, row) => {
    if (row.oneTime) return sum;
    if (row.key === 'discount') return sum + row.amount;
    if (row.key.startsWith('equipment') || row.key.startsWith('service')) return sum + row.amount;
    return sum + (commissionItems[row.key] ? row.amount : 0);
  }, 0);
}

/** Blends the agent's standard commission rate with any per-catalog-item
 * special rate (EquipmentCatalogItem/ServiceCatalogItem.commission_rate_override,
 * snapshotted onto the row as QuoteRowRecord.commissionRate) — a row with
 * no override earns commission at the agent's own rate exactly as before;
 * one with an override earns commission at that rate instead, on just its
 * own amount. With no overridden rows this reduces to the plain
 * commissionBase × agentRate multiplication used previously. One-time fee
 * rows are excluded since they're already excluded from commissionBase. */
export function calcBlendedMonthlyCommission(
  commissionBase: number,
  rows: QuoteRowRecord[],
  agentRate: number
): number {
  const overrideRows = rows.filter(
    (r) =>
      r.commissionRate != null &&
      !r.oneTime &&
      (r.key.startsWith('equipment') || r.key.startsWith('service'))
  );
  const overrideBase = overrideRows.reduce((s, r) => s + r.amount, 0);
  const overrideCommission = overrideRows.reduce(
    (s, r) => s + (r.amount * (r.commissionRate as number)) / 100,
    0
  );
  const normalBase = commissionBase - overrideBase;
  return (normalBase * agentRate) / 100 + overrideCommission;
}

export function calculateCommission(
  monthlyCommission: number,
  startDate: string,
  months: number
): CommissionCalcResult {
  const halfMonthlyCommission = monthlyCommission * 0.5;

  const start = new Date(startDate);
  const commissionFullEnd = addDays(addMonths(start, months), -1);
  const commissionHalfStart = addDays(commissionFullEnd, 1);

  // The 100%-rate term's total only — the 50% extension afterward has no
  // fixed end, so there's no longer a finite grand total to compute.
  const totalCommission = monthlyCommission * months;

  return {
    monthlyCommission,
    halfMonthlyCommission,
    commissionFullEnd: format(commissionFullEnd, 'yyyy-MM-dd'),
    commissionHalfStart: format(commissionHalfStart, 'yyyy-MM-dd'),
    totalCommission,
  };
}
