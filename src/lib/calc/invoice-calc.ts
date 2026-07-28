import { addDays, addMonths, differenceInCalendarMonths, format } from 'date-fns';
import type { Contract, QuoteRowRecord } from '@/types/domain';

// Kept in sync with the frozen quote_snapshot.rows key convention (see
// equipment-pricing.ts's `equipment:${catalogId}` / `equipment-overage:...`).
const EQUIPMENT_ROW_PREFIX = 'equipment';

// Equipment left with the customer after the contract's own term ends (no
// new contract signed yet) transfers ownership to the customer — this is no
// longer a rental, so the reduced month-to-month charge is a maintenance
// fee, not "reduced rent". The rate itself (30% of what the rental used to
// be) is unchanged, only the characterization is.
const POST_TERM_EQUIPMENT_RATE = 0.3;

/** Also used by termination-form.tsx to tell whether a requested termination
 * date falls after the contract's own term already ended — at that point
 * equipment ownership has already passed to the customer (see the post-term
 * maintenance-fee billing below), so there is nothing left to amortize. */
export function getContractEndDate(contract: Contract): string {
  return (
    contract.end_date ??
    format(addDays(addMonths(new Date(contract.start_date), contract.months), -1), 'yyyy-MM-dd')
  );
}

function getMonthEnd(month: string): string {
  return format(addDays(addMonths(new Date(`${month}-01`), 1), -1), 'yyyy-MM-dd');
}

// Ported 1:1 from the source app's contractActiveInMonth(): a contract is
// billable for month `m` when `m` falls within [billingDate, endDate].
export function isContractActiveInMonth(contract: Contract, month: string): boolean {
  const start = contract.billing_date ?? contract.start_date;
  const end = getContractEndDate(contract);
  const monthEnd = getMonthEnd(month);
  return start <= monthEnd && end >= `${month}-01`;
}

function postTermEquipmentRows(contract: Contract): QuoteRowRecord[] {
  const rows: QuoteRowRecord[] = contract.quote_snapshot?.rows ?? [];
  return rows.filter(
    (r) => r.key?.startsWith(EQUIPMENT_ROW_PREFIX) && Number(r.amount || 0) !== 0
  );
}

/** A contract is still billable after its own term ends — at the reduced
 * equipment-only rate — as long as it hasn't been formally terminated and
 * still has rented equipment worth billing (once none is left, or once
 * terminated, it stops appearing here entirely). */
export function isContractBillableInMonth(contract: Contract, month: string): boolean {
  if (contract.status === 'terminated') return false;
  if (isContractActiveInMonth(contract, month)) return true;
  const end = getContractEndDate(contract);
  if (getMonthEnd(month) <= end) return false; // month is before the term, not after
  return postTermEquipmentRows(contract).length > 0;
}

/** True once `discountMonths` (if set) has elapsed as of the target month —
 * the discount row no longer applies and the month bills at full price. */
function isDiscountExpired(contract: Contract, month: string): boolean {
  const discountMonths = Number(contract.quote_snapshot?.inputs?.discountMonths ?? 0);
  if (!discountMonths) return false;
  // Whole-calendar-month difference, not day/30.4375 averaging (which
  // undercounts on short months like February) — invoicing runs in whole
  // calendar months, so the boundary needs to line up exactly.
  const elapsed = differenceInCalendarMonths(new Date(`${month}-01`), new Date(contract.start_date));
  return elapsed >= discountMonths;
}

export interface InvoiceLineItem {
  label: string;
  amount: number;
}

// Ported 1:1 from invoiceLineItems(): falls back to a single generic line
// when the contract's quote snapshot has no nonzero rows. Extended with two
// time-aware cases: a time-limited discount that has expired (drop that
// row), and post-term equipment-only billing at a reduced rate.
export function invoiceLineItems(contract: Contract, month: string): InvoiceLineItem[] {
  if (!isContractActiveInMonth(contract, month)) {
    return postTermEquipmentRows(contract).map((r) => ({
      label: `${r.label} 유지보수료`,
      amount: Math.round(r.amount * POST_TERM_EQUIPMENT_RATE),
    }));
  }

  const rows: QuoteRowRecord[] = contract.quote_snapshot?.rows ?? [];
  const effectiveRows = isDiscountExpired(contract, month)
    ? rows.filter((r) => r.key !== 'discount')
    : rows;
  const nonZero = effectiveRows.filter((r) => Number(r.amount || 0) !== 0);
  if (nonZero.length) return nonZero.map((r) => ({ label: r.label, amount: r.amount }));
  return [{ label: 'Managed IT Outsourcing Service', amount: Number(contract.monthly_fee || 0) }];
}

export interface InvoiceTotals {
  subtotal: number;
  ppn: number;
  total: number;
}

export function invoiceTotals(contract: Contract, month: string, ppnRate: number): InvoiceTotals {
  let subtotal: number;
  if (!isContractActiveInMonth(contract, month)) {
    subtotal = postTermEquipmentRows(contract).reduce(
      (sum, r) => sum + Math.round(r.amount * POST_TERM_EQUIPMENT_RATE),
      0
    );
  } else if (isDiscountExpired(contract, month)) {
    const discountRow = (contract.quote_snapshot?.rows ?? []).find((r) => r.key === 'discount');
    const discountAmount = discountRow ? Number(discountRow.amount || 0) : 0; // stored as a negative number
    subtotal = Number(contract.monthly_fee || 0) - discountAmount;
  } else {
    subtotal = Number(contract.monthly_fee || 0);
  }
  const ppn = Math.round((subtotal * Number(ppnRate || 0)) / 100);
  return { subtotal, ppn, total: subtotal + ppn };
}
