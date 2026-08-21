import { addDays, addMonths, differenceInCalendarMonths, format } from 'date-fns';
import type { Contract, QuoteRowRecord } from '@/types/domain';

// Kept in sync with the frozen quote_snapshot.rows key convention (see
// equipment-pricing.ts's `equipment:${catalogId}` / `equipment-overage:...`).
const EQUIPMENT_ROW_PREFIX = 'equipment';

// Equipment left with the customer after the contract's own term ends (no
// new contract signed yet, no formal termination either) keeps being rented
// out at a reduced month-to-month rate — BCT retains ownership throughout
// (it never transfers to the customer, whether or not the term has ended or
// the equipment is fully depreciated), so this is still rent, just at a
// lower rate than the original contract.
const POST_TERM_EQUIPMENT_RATE = 0.7;

/** Also used by termination-form.tsx to tell whether a requested termination
 * date falls after the contract's own term already ended — at that point
 * billing has already shifted to the reduced post-term rental rate (see
 * below), but BCT's ownership of the equipment is unaffected either way. */
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

/** Printers are excluded from the post-term rate reduction — they keep
 * billing at their full, unchanged rental rate indefinitely (unlike other
 * equipment, which drops to POST_TERM_EQUIPMENT_RATE after the term ends). */
function isPrinterRow(contract: Contract, row: QuoteRowRecord): boolean {
  const catalogId = row.key?.slice(EQUIPMENT_ROW_PREFIX.length + 1);
  const selection = (contract.quote_snapshot?.equipment_selections ?? []).find(
    (e) => e.catalogId === catalogId
  );
  return selection?.category === 'printer';
}

function equipmentRows(contract: Contract): QuoteRowRecord[] {
  const rows: QuoteRowRecord[] = contract.quote_snapshot?.rows ?? [];
  return rows.filter((r) => r.key?.startsWith(EQUIPMENT_ROW_PREFIX) && Number(r.amount || 0) !== 0);
}

/** Non-printer equipment left with the customer after the contract's own
 * term ends — still rented (BCT keeps ownership), billed at the reduced
 * post-term rate (see POST_TERM_EQUIPMENT_RATE). */
function postTermEquipmentRows(contract: Contract): QuoteRowRecord[] {
  return equipmentRows(contract).filter((r) => !isPrinterRow(contract, r));
}

/** Printers left with the customer after the contract's own term ends —
 * these keep billing at their full, unchanged rental rate for as long as
 * the customer keeps them. */
function postTermPrinterRows(contract: Contract): QuoteRowRecord[] {
  return equipmentRows(contract).filter((r) => isPrinterRow(contract, r));
}

/** A contract is still billable after its own term ends — at the reduced
 * post-term rate for other equipment, and at full rate for any printers —
 * as long as it hasn't been formally terminated and still has rented
 * equipment worth billing (once none is left, or once terminated, it stops
 * appearing here entirely). */
export function isContractBillableInMonth(contract: Contract, month: string): boolean {
  if (contract.status === 'terminated') return false;
  if (isContractActiveInMonth(contract, month)) return true;
  const end = getContractEndDate(contract);
  if (getMonthEnd(month) <= end) return false; // month is before the term, not after
  return postTermEquipmentRows(contract).length > 0 || postTermPrinterRows(contract).length > 0;
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

/** The actual QuoteRowRecord list that determines this month's bill — shared
 * by invoiceLineItems()/invoiceTotals() (which map it down to display-only
 * fields) and the commission engine (commission-report.ts), which needs the
 * full row — including key/commissionable/commissionRate — to compute that
 * month's commissionable base. Exported as commissionableRowsForMonth since
 * outside this file that's the only reason to call it. */
function effectiveRowsForMonth(contract: Contract, month: string): QuoteRowRecord[] {
  if (!isContractActiveInMonth(contract, month)) {
    const postTermItems = postTermEquipmentRows(contract).map((r) => ({
      ...r,
      amount: Math.round(r.amount * POST_TERM_EQUIPMENT_RATE),
    }));
    return [...postTermItems, ...postTermPrinterRows(contract)];
  }

  const rows: QuoteRowRecord[] = contract.quote_snapshot?.rows ?? [];
  const effectiveRows = isDiscountExpired(contract, month)
    ? rows.filter((r) => r.key !== 'discount')
    : rows;
  const nonZero = effectiveRows.filter((r) => Number(r.amount || 0) !== 0);
  if (nonZero.length) return nonZero;
  return [
    {
      key: 'base',
      label: 'Managed IT Outsourcing Service',
      amount: Number(contract.monthly_fee || 0),
      cost: 0,
      init: 0,
      commissionable: true,
    },
  ];
}

export { effectiveRowsForMonth as commissionableRowsForMonth };

export interface InvoiceLineItem {
  /** Korean fallback/print text — invoice-document.tsx (deliberately
   * Korean-only, unlike the bilingual quote/contract documents) renders this
   * directly; the staff dashboard invoice page renders locale-aware text via
   * renderInvoiceLineItemLabel(item, locale) instead. */
  label: string;
  labelKey?: string;
  labelId?: string;
  labelKo?: string;
  params?: Record<string, string | number>;
  /** True for a post-term equipment row — renderInvoiceLineItemLabel appends
   * the locale-appropriate "extended rental" suffix instead of it being
   * baked into `label` at a single locale. */
  postTermExtension?: boolean;
  amount: number;
}

// Ported 1:1 from invoiceLineItems(): falls back to a single generic line
// when the contract's quote snapshot has no nonzero rows. Extended with two
// time-aware cases: a time-limited discount that has expired (drop that
// row), and post-term equipment-only billing at a reduced rate.
export function invoiceLineItems(contract: Contract, month: string): InvoiceLineItem[] {
  const isPostTerm = !isContractActiveInMonth(contract, month);
  return effectiveRowsForMonth(contract, month).map((r) => ({
    label: r.label,
    labelKey: r.labelKey,
    labelId: r.labelId,
    labelKo: r.labelKo,
    params: r.params,
    postTermExtension: isPostTerm && !isPrinterRow(contract, r) ? true : undefined,
    amount: r.amount,
  }));
}

export interface InvoiceTotals {
  subtotal: number;
  ppn: number;
  total: number;
}

export function invoiceTotals(contract: Contract, month: string, ppnRate: number): InvoiceTotals {
  const subtotal = effectiveRowsForMonth(contract, month).reduce((sum, r) => sum + r.amount, 0);
  const ppn = Math.round((subtotal * Number(ppnRate || 0)) / 100);
  return { subtotal, ppn, total: subtotal + ppn };
}
