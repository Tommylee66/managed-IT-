import {
  billableOverage,
  includedAllowance,
  isColorTiered,
  overageTierLabel,
  type OverageTier,
} from '@/lib/calc/equipment-pricing';
import { formatRupiah } from '@/lib/utils/currency';
import type { EquipmentSelection } from '@/types/domain';

/** The customer-facing *terms* behind a usage charge — "the rental covers
 * 1,500 mono pages, extra pages are Rp 90 each" — as opposed to the charge
 * itself, which equipmentPricedRows produces. A document that showed only
 * the charge would have the customer signing up to a per-page price that
 * appears nowhere in it, and a printer whose estimated usage stays inside
 * its allowance produces no priced row at all, so its terms would go
 * unstated entirely. Both the quote and the contract render these rather
 * than composing the wording themselves, so the terms a customer signs
 * always match the arithmetic that bills them. */
export interface OverageTermRow {
  modelName: string;
  /** Which meter this row prices. Both tiers of a color printer appear as
   * their own row; a mono-only item has a single row with tier `null`. */
  tier: OverageTier;
  /** Bilingual tier name, empty strings when tier is `null`. */
  tierName: { id: string; ko: string };
  /** Allowance the monthly rental covers for the contracted quantity —
   * what the customer is actually entitled to. */
  includedQty: number;
  /** The per-unit allowance and unit count behind includedQty, so a
   * multi-unit rental can show where the total came from. */
  includedPerUnit: number;
  qty: number;
  /** Customer price per unit beyond the allowance. */
  rate: number;
  /** Usage this tier is priced at, as entered on the quote — the raw
   * figure, before the allowance is deducted. Note this is the *contracted*
   * usage: monthly invoices are generated from the frozen quote snapshot,
   * not from a meter read each month (see OVERAGE_ESTIMATE_NOTE), so a
   * document must not present it as that month's actual reading. */
  usedQty: number;
  /** What actually bills: max(0, usedQty - includedQty). */
  billableQty: number;
  /** billableQty x rate. */
  amount: number;
}

/** Model name qualified by tier, for a table's item column. */
export function overageTermItemLabel(row: OverageTermRow): { id: string; ko: string } {
  return {
    id: row.tierName.id ? `${row.modelName} — ${row.tierName.id}` : row.modelName,
    ko: row.tierName.ko ? `${row.modelName} — ${row.tierName.ko}` : row.modelName,
  };
}

function termRow(
  s: EquipmentSelection,
  tier: OverageTier,
  rate: number,
  includedPerUnit: number,
  usedQty: number
): OverageTermRow {
  const billableQty = billableOverage(usedQty, includedPerUnit, s.qty);
  return {
    modelName: s.modelName,
    tier,
    tierName: overageTierLabel(tier),
    includedQty: includedAllowance(includedPerUnit, s.qty),
    includedPerUnit,
    qty: s.qty,
    rate,
    usedQty: usedQty ?? 0,
    billableQty,
    amount: billableQty * rate,
  };
}

/** One row per metered tier that has a price, in the same order the priced
 * rows are emitted (mono/plain first, then color). */
export function equipmentOverageTerms(selections: EquipmentSelection[]): OverageTermRow[] {
  const rows: OverageTermRow[] = [];
  for (const s of selections) {
    const colorTiered = isColorTiered(s.colorOverageRate, s.colorIncludedQty);
    if (s.overageRate != null) {
      rows.push(
        termRow(s, colorTiered ? 'mono' : null, s.overageRate, s.includedQty ?? 0, s.overageQty ?? 0)
      );
    }
    if (colorTiered && s.colorOverageRate != null) {
      rows.push(
        termRow(s, 'color', s.colorOverageRate, s.colorIncludedQty ?? 0, s.colorOverageQty ?? 0)
      );
    }
  }
  return rows;
}

/** `흑백 1,500장(1대당 500장 × 3대)` / `1.500 lembar Hitam Putih (500 per unit
 * x 3 unit)`, dropping the tier word on a mono-only item where there is no
 * second tier to tell it apart from, and the derivation on a single-unit
 * rental where the total already is the per-unit figure. */
function allowancePhrase(row: OverageTermRow): { id: string; ko: string } {
  const perUnit = {
    ko: row.qty > 1 ? `(1대당 ${row.includedPerUnit.toLocaleString('ko-KR')}장 × ${row.qty}대)` : '',
    id: row.qty > 1 ? ` (${row.includedPerUnit.toLocaleString('id-ID')} per unit x ${row.qty} unit)` : '',
  };
  return {
    ko: `${row.tierName.ko ? `${row.tierName.ko} ` : ''}${row.includedQty.toLocaleString('ko-KR')}장${perUnit.ko}`,
    id: `${row.includedQty.toLocaleString('id-ID')} lembar${row.tierName.id ? ` ${row.tierName.id}` : ''}${perUnit.id}`,
  };
}

/** `흑백 장당 Rp 90` / `Rp 90 per lembar Hitam Putih` */
function ratePhrase(row: OverageTermRow): { id: string; ko: string } {
  return {
    ko: `${row.tierName.ko ? `${row.tierName.ko} ` : ''}장당 ${formatRupiah(row.rate, 'ko')}`,
    id: `${formatRupiah(row.rate, 'id')} per lembar${row.tierName.id ? ` ${row.tierName.id}` : ''}`,
  };
}

/** How the quoted monthly amount relates to these per-page terms. Worth
 * stating precisely, because the two can otherwise look contradictory: the
 * monthly figure is a single fixed number that already contains a usage
 * estimate. Monthly invoices are generated from the contract's frozen quote
 * snapshot (see invoice-calc.ts), NOT from a meter read each month — so the
 * quoted overage repeats every month until a change request revises it.
 * Promising "billed per actual usage" here would describe behavior this
 * system does not have. */
const ESTIMATE_NOTE_ID =
  'Kelebihan pemakaian yang termasuk dalam tagihan bulanan di atas dihitung dari perkiraan pemakaian pada saat penawaran dibuat, ' +
  'dan ditagih dengan jumlah yang sama setiap bulan. Jika pemakaian aktual berbeda dari perkiraan, penyesuaian dilakukan melalui permintaan perubahan layanan.';

/** For the quote, which addresses the customer in polite register. */
export const OVERAGE_ESTIMATE_NOTE = {
  id: ESTIMATE_NOTE_ID,
  ko:
    '위 월 청구액에 포함된 초과 사용량은 견적 시점의 예상 사용량을 기준으로 산정되며, 매월 동일 금액으로 청구됩니다. ' +
    '실제 사용량이 예상과 달라지는 경우 변경요청을 통해 조정합니다.',
};

/** Same statement as a contract clause. Only the Korean differs — every
 * other clause in contract-clauses.ts is written in plain declarative
 * ('-다') form, and a lone polite sentence would read as pasted in. */
const OVERAGE_ESTIMATE_CLAUSE = {
  id: ESTIMATE_NOTE_ID,
  ko:
    '위 월 청구액에 포함된 초과 사용량은 견적 시점의 예상 사용량을 기준으로 산정되며, 매월 동일 금액으로 청구된다. ' +
    '실제 사용량이 예상과 달라지는 경우 변경요청을 통해 조정한다.',
};

/** The same terms as one contract clause per rented item. The contract
 * document has no line-item table, only prose clauses, so per-page terms
 * have to be stated as a clause to form part of what is signed. */
export function equipmentOverageClauses(
  selections: EquipmentSelection[]
): { id: string; ko: string }[] {
  const clauses: { id: string; ko: string }[] = [];

  for (const s of selections) {
    const tiers = equipmentOverageTerms([s]);
    if (tiers.length === 0) continue;

    const withAllowance = tiers.filter((t) => t.includedQty > 0);
    const rates = tiers.map(ratePhrase);
    const ratesKo = rates.map((r) => r.ko).join(', ');
    const ratesId = rates.map((r) => r.id).join(' dan ');

    if (withAllowance.length === 0) {
      clauses.push({
        ko: `「${s.modelName}」 사용량 요금: 사용량은 ${ratesKo}으로 청구한다.`,
        id: `Biaya pemakaian "${s.modelName}": pemakaian ditagih ${ratesId}.`,
      });
      continue;
    }

    const allowances = withAllowance.map(allowancePhrase);

    clauses.push({
      ko:
        `「${s.modelName}」 인쇄 요금: 월 임대료에 ${allowances.map((a) => a.ko).join(', ')}이 포함된다. ` +
        `이를 초과하는 사용량은 ${ratesKo}으로 청구한다. 무상 제공분은 매월 초기화되며 다음 달로 이월되지 않는다.`,
      id:
        `Biaya cetak "${s.modelName}": tarif sewa bulanan sudah mencakup ${allowances.map((a) => a.id).join(' dan ')}. ` +
        `Pemakaian di atas kuota tersebut ditagih ${ratesId}. Kuota gratis direset setiap bulan dan tidak diakumulasikan ke bulan berikutnya.`,
    });
  }

  // Stated once at the end rather than repeated per item — it describes the
  // billing mechanism, which is the same whatever the item.
  if (clauses.length > 0) clauses.push(OVERAGE_ESTIMATE_CLAUSE);

  return clauses;
}
