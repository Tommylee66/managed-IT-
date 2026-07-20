// Ported 1:1 from the source app's calcQuoteForInputs() (index.html ~line 421).
// Do not "clean up" the magic numbers below (250000, 1500000, 500000) —
// they're hardcoded in the original pricing engine, not derived from rates.

import type { Rates, QuoteInputs, QuoteRowRecord } from '@/types/domain';

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
  rates: Pick<Rates, 'base_monthly' | 'contract24_addon' | 'employee_unit' | 'visit2_addon' | 'priority' | 'vpn_base' | 'vpn_branch' | 'security_monitor' | 'security_device' | 'locations' | 'commission_items'> & {
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

  const emp = Math.max(0, Number(inputs.emp || 0) - 20);
  if (emp)
    add('employee', `직원/PC 추가 ${emp}명`, emp * rates.employee_unit, emp * cost.costEmp, 0, true, 'employeeExtra', {
      emp,
    });

  if (Number(inputs.visit) === 2) {
    add('visit', '월 2회 방문점검 추가', rates.visit2_addon, cost.costVisit, 0, true, 'visitTwice');
  } else {
    add('visit', '월 1회 방문점검 원가 반영', 0, cost.costVisit, 0, false, 'visitOnceCost');
  }

  const loc = (rates.locations || [])[Number(inputs.locationIndex || 0)] || rates.locations[0];
  if (loc && (loc.fee || loc.cost)) {
    add('location', `로케이션: ${loc.name}`, loc.fee, loc.cost, 0, true, 'location', { name: loc.name });
  }

  if (inputs.priority === 'yes')
    add('priority', '우선 장애대응', rates.priority, 250_000, 0, true, 'priority');

  if (inputs.vpn === 'base')
    add('vpn', 'Managed VPN 기본', rates.vpn_base, cost.costVpnBase, 1_500_000, true, 'vpnBase');

  const branches = Number(inputs.vpnBranches || 0);
  if (branches > 0) {
    add(
      'vpn',
      `VPN 추가 지점 ${branches}곳`,
      branches * rates.vpn_branch,
      branches * cost.costVpnBranch,
      branches * 500_000,
      true,
      'vpnBranchExtra',
      { branches }
    );
  }

  if (inputs.security === 'monitor') {
    add('security', '고객 보유 보안장비 관제', rates.security_monitor, cost.costSecMonitor, 0, true, 'securityMonitor');
  }
  if (inputs.security === 'device') {
    add(
      'security',
      'FortiGate 등 보안장비 제공+관제',
      rates.security_device,
      cost.costSecDevice,
      init.initSecurityDevice,
      true,
      'securityDevice'
    );
  }

  const discount = Number(inputs.discount || 0);
  if (discount) add('discount', '할인/조정액', -Math.abs(discount), 0, 0, true, 'discount');

  const monthly = rows.reduce((s, x) => s + x.amount, 0);
  const monthlyCost = rows.reduce((s, x) => s + x.cost, 0);
  const initCost = rows.reduce((s, x) => s + x.init, 0);
  const amort = initCost / m;
  const totalCost = monthlyCost + amort;
  const margin = monthly ? ((monthly - totalCost) / monthly) * 100 : 0;
  const ci = rates.commission_items as unknown as Record<string, boolean>;
  const commissionBase = rows.reduce((s, x) => s + (ci[x.key] ? x.amount : 0), 0);

  return { rows, monthly, monthlyCost, initCost, amort, totalCost, margin, commissionBase };
}

export function calculatePpn(monthly: number, ppnRate: number): number {
  return Math.round((monthly * ppnRate) / 100);
}
