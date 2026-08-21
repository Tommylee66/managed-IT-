// Ported 1:1 from the source app's termination settlement logic
// (contractElapsedMonths/contractRemainingMonths/collectTerminationInputDecisions/
// terminationCalculation). Supports partial-quantity splits per asset row
// (some units collected by BCT, some left with the customer and billed for
// their unamortized cost) rather than a single all-or-nothing flag per asset.

import { differenceInCalendarDays } from 'date-fns';
import type { AssetType, AssetOwner } from '@/types/domain';

// CCTV/printer used to be hardcoded here too, back when they were always
// the customer's own equipment (BCT only maintained them). Now BCT can also
// supply/install rental CCTV and printers (see equipment_catalog), so those
// two are recoverable exactly like AP/hub whenever `owner` is actually
// 'bct' — ownership alone decides it, not the asset type.
const NON_RECOVERABLE_TYPES: AssetType[] = ['starlink', 'pc_server'];

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
  /** When this specific asset was actually installed (`assets.registered_at`)
   * — equipment added mid-contract via a change request has less service
   * time than the contract's own start date would imply, so its unamortized
   * value must be computed from its own install date, not the contract's. */
  registeredAt: string;
  /** Per-unit monthly rental rate, matched from the contract's
   * quote_snapshot.equipment_selections by model name — only used for
   * `type === 'printer'` rows (see calcAssetDecision). Undefined/0 for
   * everything else, and for printers with no matching catalog rate. */
  monthlyRate?: number;
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

  // Printers keep billing at their full monthly rate indefinitely after the
  // contract's own term ends instead of dropping to the reduced post-term
  // rate other equipment gets (see invoice-calc.ts's postTermPrinterRows) —
  // so a printer's early-termination exit cost is what the customer would
  // otherwise have kept paying for the rest of the term (remaining months ×
  // monthly rate), not a depreciation-style unamortized-cost calc. This
  // value already IS the final exit cost for the row — summarizeTerminationPlan
  // excludes printer rows from the penaltyRate surcharge applied to everyone
  // else's unamortized figure, so it isn't penalized twice.
  if (input.type === 'printer' && input.monthlyRate) {
    const unamortized = billQty > 0 ? Math.round(input.monthlyRate * billQty * remainingMonths) : 0;
    return { ...input, collectQty, billQty, action, unitCost, unamortized };
  }

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
  // Structural, not `AssetDecisionResult[]` — this is also called with the
  // stored `AssetDecision[]` shape (see data-access/termination.ts's toView),
  // which doesn't carry every AssetDecisionResult field (e.g. registeredAt).
  decisions: Pick<AssetDecisionResult, 'type' | 'unamortized' | 'collectQty' | 'billQty'>[],
  penaltyRate: number,
  adminFee: number,
  unpaid: number
): TerminationSummary {
  const unamortizedTotal = decisions.reduce((s, d) => s + Number(d.unamortized || 0), 0);
  // Printer rows' `unamortized` already IS the full exit cost (see
  // calcAssetDecision) — only non-printer rows' unamortized-cost figure
  // still needs the penaltyRate surcharge applied on top.
  const penaltyBase = decisions
    .filter((d) => d.type !== 'printer')
    .reduce((s, d) => s + Number(d.unamortized || 0), 0);
  const penalty = Math.round((penaltyBase * penaltyRate) / 100);
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
