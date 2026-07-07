import { addDays, addMonths, format } from 'date-fns';
import type { Contract, QuoteRowRecord } from '@/types/domain';

// Ported 1:1 from the source app's contractActiveInMonth(): a contract is
// billable for month `m` when `m` falls within [billingDate, endDate].
export function isContractActiveInMonth(contract: Contract, month: string): boolean {
  const start = contract.billing_date ?? contract.start_date;
  const end =
    contract.end_date ?? format(addDays(addMonths(new Date(contract.start_date), contract.months), -1), 'yyyy-MM-dd');
  const monthEnd = format(
    addDays(addMonths(new Date(`${month}-01`), 1), -1),
    'yyyy-MM-dd'
  );
  return start <= monthEnd && end >= `${month}-01`;
}

export interface InvoiceLineItem {
  label: string;
  amount: number;
}

// Ported 1:1 from invoiceLineItems(): falls back to a single generic line
// when the contract's quote snapshot has no nonzero rows.
export function invoiceLineItems(contract: Contract): InvoiceLineItem[] {
  const rows: QuoteRowRecord[] = contract.quote_snapshot?.rows ?? [];
  const nonZero = rows.filter((r) => Number(r.amount || 0) !== 0);
  if (nonZero.length) return nonZero.map((r) => ({ label: r.label, amount: r.amount }));
  return [{ label: 'Managed IT Outsourcing Service', amount: Number(contract.monthly_fee || 0) }];
}

export interface InvoiceTotals {
  subtotal: number;
  ppn: number;
  total: number;
}

export function invoiceTotals(contract: Contract, ppnRate: number): InvoiceTotals {
  const subtotal = Number(contract.monthly_fee || 0);
  const ppn = Math.round((subtotal * Number(ppnRate || 0)) / 100);
  return { subtotal, ppn, total: subtotal + ppn };
}
