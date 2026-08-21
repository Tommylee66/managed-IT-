import type { Contract, ContractStatus, Invoice } from '@/types/domain';
import { getContractEndDate, commissionableRowsForMonth } from './invoice-calc';
import { computeCommissionBase, calcBlendedMonthlyCommission } from './commission-calc';

/** Looks up the invoice for one contract in one month — keyed
 * `` `${contractNo}:${month}` ``, built by listInvoicesByContracts(). */
export type InvoiceLookup = Map<string, Invoice>;

export interface ContractCommissionRow {
  contractNo: string;
  customerName: string;
  agentCode: string;
  agentName: string;
  amount: number;
  /** How much of that month's invoice was paid (0–1) — lets the payout
   * report show which rows are still awaiting collection. */
  paidRatio: number;
}

export interface AgentCommissionGroup {
  agentCode: string;
  agentName: string;
  /** Tax ID for withholding-tax (PPh) filing on this payout — null if the
   * agent hasn't registered one. Always the unmasked value: this report is
   * master-only by nature (commission figures are hidden from staff). */
  npwp: string | null;
  rows: ContractCommissionRow[];
  subtotal: number;
}

function daysInMonth(year: number, month: number): number {
  // month is 1-indexed; day 0 of the next month is the last day of this one.
  return new Date(year, month, 0).getDate();
}

function daysBetweenInclusive(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/** Days where [aStart, aEnd] and [bStart, bEnd] both hold, or 0 if they
 * don't overlap. All ranges are inclusive calendar dates. */
function overlapDays(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  if (start > end) return 0;
  return daysBetweenInclusive(start, end);
}

/** Computes one contract's commission for a single calendar month, live from
 * that month's actual invoice — there is no longer a single fixed
 * commission figure for a contract (see the doc comment on Contract's
 * commission_base/monthly_commission/etc. fields in types/domain.ts).
 *
 * Returns 0 if no invoice was issued for this contract+month — commission
 * only accrues once a real invoice exists, matching the agent agreement's
 * own clause 3 ("수수료는 고객이 실제로 납부한 청구액을 기준으로 산정"). The
 * result is then scaled by how much of that invoice was actually paid
 * (invoice.paid_amount / invoice.total), so a partially-paid invoice yields
 * partial commission and an unpaid one yields none — commission is
 * calculated from what was billed, but paid out based on what was collected.
 *
 * The 100%-to-50% post-term rate transition is a separate axis from "how
 * much was billed" — contracts bill (and pay commission) on a month-end
 * basis, so any partial period is prorated by calendar day, same rule used
 * for mid-month fee changes (see calc/proration.ts). Three things can make a
 * month partial for a given contract:
 *   - the contract started mid-month
 *   - the contract was terminated mid-month
 *   - the 100%-to-50% transition (the contract's own term end, from
 *     getContractEndDate) falls mid-month
 * The 50%-rate window has no fixed end — it runs through `activeEnd` (which
 * already clamps to the termination date once a contract is terminated), so
 * commission at 50% continues for as long as the customer keeps using the
 * service and keeps paying for it. */
export function calcContractCommissionForMonth(
  contract: Contract,
  monthKey: string,
  invoice: Invoice | null,
  commissionItems: Record<string, boolean>
): number {
  if (!invoice || invoice.total <= 0) return 0;
  if (contract.commission_rate == null || Number.isNaN(contract.commission_rate)) return 0;

  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month));
  const totalDaysInMonth = daysInMonth(year, month);

  const contractStart = new Date(contract.start_date);
  const contractEnd = contract.status === 'terminated' && contract.end_date ? new Date(contract.end_date) : monthEnd;
  const activeEnd = contractEnd < monthEnd ? contractEnd : monthEnd;
  if (activeEnd < monthStart || activeEnd < contractStart) return 0;

  const termEnd = new Date(getContractEndDate(contract));
  const halfStart = new Date(termEnd.getFullYear(), termEnd.getMonth(), termEnd.getDate() + 1);

  const fullDays = overlapDays(monthStart, activeEnd, contractStart, termEnd);
  const halfDays = overlapDays(monthStart, activeEnd, halfStart, activeEnd);

  const monthRows = commissionableRowsForMonth(contract, monthKey);
  const monthBase = computeCommissionBase(monthRows, commissionItems);
  const monthlyCommission = calcBlendedMonthlyCommission(monthBase, monthRows, contract.commission_rate);
  const halfMonthlyCommission = monthlyCommission * 0.5;

  const dailyFull = monthlyCommission / totalDaysInMonth;
  const dailyHalf = halfMonthlyCommission / totalDaysInMonth;
  const rawCommission = fullDays * dailyFull + halfDays * dailyHalf;

  const paidRatio = Math.min(1, Math.max(0, (invoice.paid_amount ?? 0) / invoice.total));
  return Math.round(rawCommission * paidRatio);
}

/** Builds the full monthly report: one row per contract that earned any
 * commission that month, grouped by agent with a subtotal. Contracts with
 * no agent (direct/house accounts) are excluded — there's no one to pay.
 * `npwpByAgentCode` is an optional lookup (agent code -> unmasked NPWP) so
 * the report can carry the tax ID needed to file withholding tax on each
 * payout, without this pure calc function needing to know about the
 * agents table itself. */
export function calcMonthlyCommissionReport(
  contracts: Contract[],
  monthKey: string,
  invoicesByKey: InvoiceLookup,
  commissionItems: Record<string, boolean>,
  npwpByAgentCode: Map<string, string | null> = new Map()
): AgentCommissionGroup[] {
  const rows: ContractCommissionRow[] = [];
  for (const c of contracts) {
    if (!c.agent_code || !c.agent_name) continue;
    const invoice = invoicesByKey.get(`${c.no}:${monthKey}`) ?? null;
    const amount = calcContractCommissionForMonth(c, monthKey, invoice, commissionItems);
    if (amount <= 0) continue;
    const paidRatio = invoice && invoice.total > 0 ? Math.min(1, Math.max(0, (invoice.paid_amount ?? 0) / invoice.total)) : 0;
    rows.push({
      contractNo: c.no,
      customerName: c.customer_name,
      agentCode: c.agent_code,
      agentName: c.agent_name,
      amount,
      paidRatio,
    });
  }

  const groups = new Map<string, AgentCommissionGroup>();
  for (const row of rows) {
    const existing = groups.get(row.agentCode);
    if (existing) {
      existing.rows.push(row);
      existing.subtotal += row.amount;
    } else {
      groups.set(row.agentCode, {
        agentCode: row.agentCode,
        agentName: row.agentName,
        npwp: npwpByAgentCode.get(row.agentCode) ?? null,
        rows: [row],
        subtotal: row.amount,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.agentCode.localeCompare(b.agentCode));
}

function monthKeysBetween(startMonthKey: string, endMonthKey: string): string[] {
  const [startYear, startMonth] = startMonthKey.split('-').map(Number);
  const [endYear, endMonth] = endMonthKey.split('-').map(Number);
  const keys: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export interface ContractCommissionHistoryEntry {
  month: string;
  amount: number;
}

export interface ContractCommissionSummary {
  contractNo: string;
  customerCode: string;
  customerName: string;
  startDate: string;
  status: ContractStatus;
  commissionRate: number;
  /** This contract's commission for `uptoMonthKey` specifically — null if no
   * invoice has been issued for that month yet. There's no longer one fixed
   * "full rate"/"half rate" figure for the whole contract, since the base
   * now varies with the actual monthly bill (see calcContractCommissionForMonth). */
  currentMonthCommission: number | null;
  /** Every month (from contract start through `uptoMonthKey`) that earned
   * a nonzero commission — the "history" a sales agent needs to see their
   * own full track record, not just the current month's snapshot. */
  history: ContractCommissionHistoryEntry[];
  totalToDate: number;
}

/** One agent's full commission track record across every customer they've
 * brought in — every contract, with a month-by-month history and a
 * cumulative total, through `uptoMonthKey`. Unlike calcMonthlyCommissionReport
 * (a single month, all agents), this is one agent, every month to date. */
export function calcAgentCommissionHistory(
  contracts: Contract[],
  agentCode: string,
  uptoMonthKey: string,
  invoicesByKey: InvoiceLookup,
  commissionItems: Record<string, boolean>
): ContractCommissionSummary[] {
  return contracts
    .filter((c) => c.agent_code === agentCode)
    .map((c): ContractCommissionSummary => {
      const startMonthKey = c.start_date.slice(0, 7);
      const history = monthKeysBetween(startMonthKey, uptoMonthKey)
        .map((month) => ({
          month,
          amount: calcContractCommissionForMonth(c, month, invoicesByKey.get(`${c.no}:${month}`) ?? null, commissionItems),
        }))
        .filter((entry) => entry.amount > 0);
      const currentMonthInvoice = invoicesByKey.get(`${c.no}:${uptoMonthKey}`) ?? null;
      const currentMonthCommission = currentMonthInvoice
        ? calcContractCommissionForMonth(c, uptoMonthKey, currentMonthInvoice, commissionItems)
        : null;
      return {
        contractNo: c.no,
        customerCode: c.customer_code,
        customerName: c.customer_name,
        startDate: c.start_date,
        status: c.status,
        commissionRate: c.commission_rate,
        currentMonthCommission,
        history,
        totalToDate: history.reduce((sum, entry) => sum + entry.amount, 0),
      };
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
