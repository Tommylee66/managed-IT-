// Ported 1:1 from the source app's calcQuoteForInputs() (index.html ~line 421).
// Do not "clean up" the magic numbers below (250000, 1500000, 500000) —
// they're hardcoded in the original pricing engine, not derived from rates.

import type { Rates, QuoteInputs, QuoteRowRecord } from '@/types/domain';
import { computeCommissionBase } from '@/lib/calc/commission-calc';

export interface QuoteCalcResult {
  rows: QuoteRowRecord[];
  monthly: number;
  monthlyCost: number;
  initCost: number;
  amort: number;
  totalCost: number;
  margin: number;
  commissionBase: number;
}

export function calcQuoteForInputs(
  rates: Pick<
    Rates,
    | 'base_monthly'
    | 'contract24_addon'
    | 'employee_unit'
    | 'cctv_block'
    | 'locations'
    | 'commission_items'
    | 'employee_base_count'
    | 'cctv_base_count'
  > & {
    cost_fields?: Rates['cost_fields'];
    init_fields?: Rates['init_fields'];
  },
  inputs: QuoteInputs,
  months: number
): QuoteCalcResult {
  const m = Number(months || 36);
  const rows: QuoteRowRecord[] = [];
  const cost = rates.cost_fields;
  const init = rates.init_fields;

  function add(
    key: string,
    label: string,
    amount: number,
    rowCost = 0,
    rowInit = 0,
    commissionable = true,
    labelKey?: string,
    params?: Record<string, string | number>
  ) {
    rows.push({
      key,
      label,
      labelKey,
      params,
      amount: Number(amount || 0),
      cost: Number(rowCost || 0),
      init: Number(rowInit || 0),
      commissionable,
    });
  }

  if (!cost || !init) {
    throw new Error('calcQuoteForInputs requires cost_fields/init_fields (master-only rates view)');
  }

  add(
    'base',
    'Managed IT 기본 서비스',
    rates.base_monthly,
    cost.costRemote + cost.costReserve,
    init.initRouter + init.initAp + init.initHub + init.initSetup + init.initLan,
    true,
    'base'
  );

  if (m === 24) add('term', '24개월 계약 추가요금', rates.contract24_addon, 0, 0, true, 'term');

  const totalEmp = Number(inputs.emp || 0);
  const emp = Math.max(0, totalEmp - rates.employee_base_count);
  if (emp)
    add(
      'employee',
      `직원/PC 추가 ${emp}명 (총 ${totalEmp}명)`,
      emp * rates.employee_unit,
      emp * cost.costEmp,
      0,
      true,
      'employeeExtra',
      { emp, total: totalEmp }
    );

  // Base service includes rates.cctv_base_count CCTV units (see
  // baseServiceDescription in the i18n messages) — same "N included, extra
  // billed per unit" shape as employee/PC count above, not the old
  // block-based cctv_block pricing.
  const totalCctv = Number(inputs.cctv || 0);
  const cctvExtra = Math.max(0, totalCctv - rates.cctv_base_count);
  if (cctvExtra)
    add(
      'cctv',
      `CCTV 추가 ${cctvExtra}대 (총 ${totalCctv}대)`,
      cctvExtra * rates.cctv_block,
      cctvExtra * cost.costCctv,
      0,
      true,
      'cctvExtra',
      { cctvExtra, total: totalCctv }
    );

  // Visit frequency, priority response, VPN, and security add-ons no longer
  // price as hardcoded rate fields — they've moved to master-managed
  // service_catalog selections (see calc/service-pricing.ts), same as
  // AP/Hub/CCTV moved to equipment_catalog. The baseline internal cost of at
  // least one monthly visit still applies regardless of what's selected.
  add('visit', '월 1회 방문점검 원가 반영', 0, cost.costVisit, 0, false, 'visitOnceCost');

  const loc = (rates.locations || [])[Number(inputs.locationIndex || 0)] || rates.locations[0];
  if (loc && (loc.fee || loc.cost)) {
    add('location', `로케이션: ${loc.name}`, loc.fee, loc.cost, 0, true, 'location', { name: loc.name });
  }

  const discount = Number(inputs.discount || 0);
  const discountMonths = Number(inputs.discountMonths || 0);
  if (discount) {
    if (discountMonths > 0) {
      add(
        'discount',
        `할인/조정액 (최초 ${discountMonths}개월 적용)`,
        -Math.abs(discount),
        0,
        0,
        true,
        'discountLimited',
        { months: discountMonths }
      );
    } else {
      add('discount', '할인/조정액', -Math.abs(discount), 0, 0, true, 'discount');
    }
  }

  const monthly = rows.reduce((s, x) => s + x.amount, 0);
  const monthlyCost = rows.reduce((s, x) => s + x.cost, 0);
  const initCost = rows.reduce((s, x) => s + x.init, 0);
  const amort = initCost / m;
  const totalCost = monthlyCost + amort;
  const margin = monthly ? ((monthly - totalCost) / monthly) * 100 : 0;
  const commissionBase = computeCommissionBase(rows, rates.commission_items as unknown as Record<string, boolean>);

  return { rows, monthly, monthlyCost, initCost, amort, totalCost, margin, commissionBase };
}

export function calculatePpn(monthly: number, ppnRate: number): number {
  return Math.round((monthly * ppnRate) / 100);
}
