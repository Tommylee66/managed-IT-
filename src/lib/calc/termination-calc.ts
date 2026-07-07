// Ported 1:1 from the source app's termination settlement logic
// (contractElapsedMonths/contractRemainingMonths/collectTerminationInputDecisions/
// terminationCalculation). Supports partial-quantity splits per asset row
// (some units collected by BCT, some left with the customer and billed for
// their unamortized cost) rather than a single all-or-nothing flag per asset.

import { differenceInCalendarDays } from 'date-fns';
import type { AssetType, AssetOwner } from '@/types/domain';

const NON_RECOVERABLE_TYPES: AssetType[] = ['cctv', 'starlink', 'pc_server', 'printer'];

export function isNonRecoverable(owner: AssetOwner, type: AssetType): boolean {
  return owner !== 'bct' || NON_RECOVERABLE_TYPES.includes(type);
}

export function isConfigAsset(type: AssetType): boolean {
  return type === 'vpn_config';
}

export function contractElapsedMonths(startDate: string, termDate: string, totalMonths: number): number {
  const days = Math.max(0, differenceInCalendarDays(new Date(termDate), new Date(startDate)));
  return Math.min(totalMonths, Math.floor(days / 30.4375));
}

export function contractRemainingMonths(startDate: string, termDate: string, totalMonths: number): number {
  return Math.max(0, totalMonths - contractElapsedMonths(startDate, termDate, totalMonths));
}

/** Type-based cost estimate, used when an asset row has no explicit cost on
 * file — mirrors the source's estimatedAssetCost() fallback table. */
export function estimatedAssetCost(
  type: AssetType,
  qty: number,
  initFields: { initRouter: number; initAp: number; initHub: number; initSecurityDevice: number; initSetup: number; initLan: number },
  vpnBaseRate: number
): number {
  const perUnit: Partial<Record<AssetType, number>> = {
    router: initFields.initRouter,
    ap: initFields.initAp,
    hub_switch: initFields.initHub,
    security: initFields.initSecurityDevice,
    vpn_config: vpnBaseRate,
  };
  return (perUnit[type] ?? 0) * qty;
}

export interface AssetDecisionInput {
  key: string;
  assetId: string;
  type: AssetType;
  owner: AssetOwner;
  name: string;
  model: string;
  serial: string;
  qty: number;
  location: string;
  originalCost: number;
  collectQty: number;
  billQty: number;
}

export interface AssetDecisionResult extends AssetDecisionInput {
  action: 'collect' | 'leave_bill' | 'partial' | 'close_config' | 'remain_customer';
  unitCost: number;
  unamortized: number;
}

export function calcAssetDecision(
  input: AssetDecisionInput,
  remainingMonths: number,
  totalMonths: number
): AssetDecisionResult {
  if (isNonRecoverable(input.owner, input.type)) {
    return { ...input, action: 'remain_customer', collectQty: 0, billQty: 0, unitCost: 0, unamortized: 0 };
  }
  if (isConfigAsset(input.type)) {
    return { ...input, action: 'close_config', collectQty: 0, billQty: 0, unitCost: 0, unamortized: 0 };
  }

  const total = input.qty || 1;
  const collectQty = Math.max(0, Math.min(total, Math.floor(input.collectQty)));
  let billQty = Math.max(0, Math.min(total, Math.floor(input.billQty)));
  if (collectQty + billQty > total) billQty = Math.max(0, total - collectQty);

  const action = billQty > 0 && collectQty > 0 ? 'partial' : billQty > 0 ? 'leave_bill' : 'collect';
  const unitCost = total ? input.originalCost / total : 0;
  const unamortized = billQty > 0 && totalMonths ? Math.round(unitCost * billQty * remainingMonths / totalMonths) : 0;

  return { ...input, collectQty, billQty, action, unitCost, unamortized };
}

export interface TerminationSummary {
  unamortizedTotal: number;
  penalty: number;
  total: number;
  collectQtyTotal: number;
  leaveQtyTotal: number;
}

export function summarizeTerminationPlan(
  decisions: AssetDecisionResult[],
  penaltyRate: number,
  adminFee: number,
  unpaid: number
): TerminationSummary {
  const unamortizedTotal = decisions.reduce((s, d) => s + Number(d.unamortized || 0), 0);
  const penalty = Math.round((unamortizedTotal * penaltyRate) / 100);
  const collectQtyTotal = decisions.reduce((s, d) => s + Number(d.collectQty || 0), 0);
  const leaveQtyTotal = decisions.reduce((s, d) => s + Number(d.billQty || 0), 0);
  return {
    unamortizedTotal,
    penalty,
    total: unamortizedTotal + penalty + adminFee + unpaid,
    collectQtyTotal,
    leaveQtyTotal,
  };
}
