'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { listContractsByCustomer } from '@/lib/data-access/contracts';
import {
  listMeterReadingsByCustomerMonth,
  saveMeterReadings,
  type MeterReadingInput,
} from '@/lib/data-access/meter-readings';
import { isColorTiered } from '@/lib/calc/equipment-pricing';
import type { Contract } from '@/types/domain';

/** One rented, usage-billed model an engineer should read this month, with
 * whatever was already recorded for it. */
export interface MeterTarget {
  contractNo: string;
  catalogId: string;
  modelName: string;
  spec: string | null;
  qty: number;
  /** Whether this model meters color separately — decides whether the form
   * shows one page count or two. */
  colorTiered: boolean;
  includedMono: number;
  includedColor: number;
  monoRate: number | null;
  colorRate: number | null;
  /** Existing reading for the month, null when not yet read. */
  monoQty: number | null;
  colorQty: number | null;
  readingDate: string | null;
  engineer: string | null;
  memo: string | null;
}

export interface MeterTargetsResult {
  customerName: string;
  month: string;
  targets: MeterTarget[];
}

/** Contracts in force during the month, on dates rather than status — the
 * same rule the monthly report uses, and for the same reason: a contract
 * terminated since then still had its printer installed that month. */
function coversMonth(contract: Contract, monthKey: string): boolean {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return contract.start_date <= monthEnd && (!contract.end_date || contract.end_date >= monthStart);
}

export async function loadMeterTargetsAction(
  customerCode: string,
  month: string
): Promise<MeterTargetsResult> {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();

  const [contracts, readings] = await Promise.all([
    listContractsByCustomer(supabase, customerCode, session.role),
    listMeterReadingsByCustomerMonth(supabase, customerCode, month),
  ]);

  const inForce = contracts.filter((c) => coversMonth(c, month));
  const targets: MeterTarget[] = [];
  for (const contract of inForce) {
    for (const s of contract.quote_snapshot?.equipment_selections ?? []) {
      // Only items actually priced per unit of usage need a reading.
      if (s.overageRate == null && s.colorOverageRate == null) continue;
      const existing = readings.find(
        (r) => r.contract_no === contract.no && r.catalog_id === s.catalogId
      );
      targets.push({
        contractNo: contract.no,
        catalogId: s.catalogId,
        modelName: s.modelName,
        spec: s.spec,
        qty: s.qty,
        colorTiered: isColorTiered(s.colorOverageRate, s.colorIncludedQty),
        includedMono: (s.includedQty ?? 0) * Math.max(1, s.qty),
        includedColor: (s.colorIncludedQty ?? 0) * Math.max(1, s.qty),
        monoRate: s.overageRate,
        colorRate: s.colorOverageRate ?? null,
        monoQty: existing ? Number(existing.mono_qty) : null,
        colorQty: existing ? Number(existing.color_qty) : null,
        readingDate: existing?.reading_date ?? null,
        engineer: existing?.engineer ?? null,
        memo: existing?.memo ?? null,
      });
    }
  }

  return {
    customerName: inForce[0]?.customer_name ?? customerCode,
    month,
    targets,
  };
}

export interface SaveMeterReadingsInput {
  customerCode: string;
  month: string;
  /** Grouped by contract, because the unique key is per contract — the same
   * model can be rented under two of a customer's contracts. */
  byContract: { contractNo: string; entries: MeterReadingInput[] }[];
}

export async function saveMeterReadingsAction(input: SaveMeterReadingsInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();

  for (const group of input.byContract) {
    await saveMeterReadings(
      supabase,
      group.contractNo,
      input.customerCode,
      input.month,
      group.entries,
      session.userId
    );
  }

  // An already-issued invoice for this month keeps its stored total until
  // it is saved again — the readings change what a re-save computes, not
  // what was already sent.
  revalidatePath('/invoices');
  revalidatePath('/incident-logs/meter');
  return { saved: true };
}
