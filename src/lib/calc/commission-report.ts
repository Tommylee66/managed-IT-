import type { Contract, ContractStatus } from '@/types/domain';

export interface ContractCommissionRow {
  contractNo: string;
  customerName: string;
  agentCode: string;
  agentName: string;
  amount: number;
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

/** Prorates one contract's commission for a single calendar month.
 *
 * Contracts bill (and pay commission) on a month-end basis; any partial
 * period is prorated by calendar day — same rule used for mid-month fee
 * changes (see calc/proration.ts). Three things can make a month partial
 * for a given contract:
 *   - the contract started mid-month
 *   - the contract was terminated mid-month
 *   - the 100%-to-50% commission-rate transition (commission_full_end /
 *     commission_half_start, see calc/commission-calc.ts) falls mid-month
 * so this splits the month into "full-rate days" and "half-rate days"
 * within the contract's active window and prorates each independently,
 * rather than snapshotting a single rate for the whole month. */
export function calcContractCommissionForMonth(contract: Contract, monthKey: string): number {
  if (
    contract.monthly_commission == null ||
    Number.isNaN(contract.monthly_commission) ||
    !contract.commission_full_end ||
    !contract.commission_half_start ||
    !contract.commission_end
  ) {
    return 0;
  }

  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month));
  const totalDaysInMonth = daysInMonth(year, month);

  const contractStart = new Date(contract.start_date);
  const contractEnd = contract.status === 'terminated' && contract.end_date ? new Date(contract.end_date) : monthEnd;
  const activeEnd = contractEnd < monthEnd ? contractEnd : monthEnd;
  if (activeEnd < monthStart || activeEnd < contractStart) return 0;

  const fullEnd = new Date(contract.commission_full_end);
  const halfStart = new Date(contract.commission_half_start);
  const halfEnd = new Date(contract.commission_end);

  const fullDays = overlapDays(monthStart, activeEnd, contractStart, fullEnd);
  const halfDays = overlapDays(monthStart, activeEnd, halfStart, halfEnd);

  const dailyFull = contract.monthly_commission / totalDaysInMonth;
  const dailyHalf = contract.half_monthly_commission / totalDaysInMonth;

  return Math.round(fullDays * dailyFull + halfDays * dailyHalf);
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
  npwpByAgentCode: Map<string, string | null> = new Map()
): AgentCommissionGroup[] {
  const rows: ContractCommissionRow[] = [];
  for (const c of contracts) {
    if (!c.agent_code || !c.agent_name) continue;
    const amount = calcContractCommissionForMonth(c, monthKey);
    if (amount <= 0) continue;
    rows.push({
      contractNo: c.no,
      customerName: c.customer_name,
      agentCode: c.agent_code,
      agentName: c.agent_name,
      amount,
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
  monthlyCommission: number;
  halfMonthlyCommission: number;
  commissionFullEnd: string | null;
  commissionHalfStart: string | null;
  commissionEnd: string | null;
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
  uptoMonthKey: string
): ContractCommissionSummary[] {
  return contracts
    .filter((c) => c.agent_code === agentCode)
    .map((c): ContractCommissionSummary => {
      const startMonthKey = c.start_date.slice(0, 7);
      const history = monthKeysBetween(startMonthKey, uptoMonthKey)
        .map((month) => ({ month, amount: calcContractCommissionForMonth(c, month) }))
        .filter((entry) => entry.amount > 0);
      return {
        contractNo: c.no,
        customerCode: c.customer_code,
        customerName: c.customer_name,
        startDate: c.start_date,
        status: c.status,
        monthlyCommission: c.monthly_commission,
        halfMonthlyCommission: c.half_monthly_commission,
        commissionFullEnd: c.commission_full_end,
        commissionHalfStart: c.commission_half_start,
        commissionEnd: c.commission_end,
        history,
        totalToDate: history.reduce((sum, entry) => sum + entry.amount, 0),
      };
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
