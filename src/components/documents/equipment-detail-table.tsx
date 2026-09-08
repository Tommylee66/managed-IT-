import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocTable } from "@/components/documents/doc-table";
import { Bilingual } from "@/components/documents/bilingual-block";
import { EQUIPMENT_CATEGORY_LABEL } from "@/lib/calc/equipment-category-labels";
import {
  equipmentOverageTerms,
  overageTermItemLabel,
  OVERAGE_ESTIMATE_NOTE,
} from "@/lib/calc/equipment-overage-terms";
import type { EquipmentSelection } from "@/types/domain";

/** The quote, contract and monthly report are permanently bilingual
 * (Indonesian primary, Korean secondary); the invoice is a Korean-language
 * document. These tables are shared across all four, so the caller picks
 * which way headings render rather than each document growing its own copy
 * of the table and the two drifting apart. */
export type DocLang = "bilingual" | "ko";

function Label({ id, ko, lang }: { id: string; ko: string; lang: DocLang }) {
  return lang === "ko" ? <>{ko}</> : <Bilingual id={id} ko={ko} />;
}

/** Every piece of equipment on the deal, priced or not. Items with no
 * monthly rate are spec-only catalog references (documented for the record,
 * not billed) and are marked as such rather than silently showing a blank
 * price, which would otherwise read as "provided free". */
export function EquipmentDetailTable({
  selections,
  lang = "bilingual",
}: {
  selections: EquipmentSelection[];
  lang?: DocLang;
}) {
  if (selections.length === 0) return null;

  return (
    <DocTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Label id="Kategori" ko="분류" lang={lang} />
            </TableHead>
            <TableHead>
              <Label id="Model" ko="모델명" lang={lang} />
            </TableHead>
            <TableHead>
              <Label id="Spesifikasi" ko="스펙" lang={lang} />
            </TableHead>
            <TableHead className="text-right">
              <Label id="Jumlah" ko="수량" lang={lang} />
            </TableHead>
            <TableHead>
              <Label id="Kepemilikan" ko="구분" lang={lang} />
            </TableHead>
            <TableHead className="text-right">
              <Label id="Sewa Bulanan" ko="월 임대료" lang={lang} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selections.map((eq, i) => {
            const cat = EQUIPMENT_CATEGORY_LABEL[eq.category];
            const rented = eq.monthlyRate != null;
            return (
              <TableRow key={i}>
                <TableCell>
                  <Label id={cat.id} ko={cat.ko} lang={lang} />
                </TableCell>
                <TableCell>{eq.modelName}</TableCell>
                <TableCell>{eq.spec || "-"}</TableCell>
                <TableCell className="text-right">{eq.qty}</TableCell>
                <TableCell>
                  {rented ? (
                    <Label id="Sewa dari BCT" ko="BCT 임대" lang={lang} />
                  ) : (
                    <Label id="Referensi Spesifikasi" ko="스펙 참고" lang={lang} />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {rented ? (
                    <>
                      {formatRupiah(eq.monthlyRate! * eq.qty, "id")}
                      {eq.qty > 1 && (
                        <span className="block text-xs text-muted-foreground">
                          {formatRupiah(eq.monthlyRate!, "id")} x {eq.qty}
                        </span>
                      )}
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DocTable>
  );
}

/** Heading + table, so the four documents that show this don't each carry
 * their own copy of the heading text. Renders nothing when the deal has no
 * equipment at all. */
export function EquipmentDetailSection({
  selections,
  lang = "bilingual",
}: {
  selections: EquipmentSelection[];
  lang?: DocLang;
}) {
  if (selections.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 font-semibold">
        <Label id="Rincian Perangkat yang Disediakan" ko="제공 장비 상세 내역" lang={lang} />
      </h3>
      <EquipmentDetailTable selections={selections} lang={lang} />
    </div>
  );
}

/** Per-tier print pricing and usage for usage-billed equipment (printers).
 * Renders whether or not the usage exceeds the allowance: a printer that
 * stays inside its allowance produces no priced line anywhere, so this is
 * the only place its allowance and per-page rate appear at all.
 *
 * The usage figures are the *contracted* ones frozen on the quote snapshot,
 * not a meter read for the document's month — this system has no per-month
 * meter input (see OVERAGE_ESTIMATE_NOTE), so the usage column is labelled
 * "contracted basis" rather than presented as an actual reading. */
export function PrinterUsageTable({
  selections,
  lang = "bilingual",
  showNote = true,
}: {
  selections: EquipmentSelection[];
  lang?: DocLang;
  showNote?: boolean;
}) {
  const terms = equipmentOverageTerms(selections);
  if (terms.length === 0) return null;

  return (
    <>
      <DocTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Label id="Item" ko="항목" lang={lang} />
              </TableHead>
              <TableHead className="text-right">
                <Label id="Pemakaian (Dasar Kontrak)" ko="사용 장수 (계약 기준)" lang={lang} />
              </TableHead>
              <TableHead className="text-right">
                <Label id="Kuota Gratis" ko="무상 제공" lang={lang} />
              </TableHead>
              <TableHead className="text-right">
                <Label id="Lembar Ditagih" ko="과금 장수" lang={lang} />
              </TableHead>
              <TableHead className="text-right">
                <Label id="Tarif / Lembar" ko="장당 단가" lang={lang} />
              </TableHead>
              <TableHead className="text-right">
                <Label id="Jumlah" ko="금액" lang={lang} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((t, i) => {
              const label = overageTermItemLabel(t);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Label id={label.id} ko={label.ko} lang={lang} />
                  </TableCell>
                  <TableCell className="text-right">{t.usedQty.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    {t.includedQty > 0 ? (
                      <>
                        {t.includedQty.toLocaleString("id-ID")}
                        {t.qty > 1 && (
                          <span className="block text-xs text-muted-foreground">
                            {t.includedPerUnit.toLocaleString("id-ID")} x {t.qty}
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">{t.billableQty.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{formatRupiah(t.rate, "id")}</TableCell>
                  <TableCell className="text-right">{formatRupiah(t.amount, "id")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DocTable>
      {showNote && (
        <p className="mt-1 text-xs text-muted-foreground">
          <Label
            id={`Kuota gratis direset setiap bulan dan tidak diakumulasikan ke bulan berikutnya. ${OVERAGE_ESTIMATE_NOTE.id}`}
            ko={`무상 제공분은 매월 초기화되며 다음 달로 이월되지 않습니다. ${OVERAGE_ESTIMATE_NOTE.ko}`}
            lang={lang}
          />
        </p>
      )}
    </>
  );
}

/** Heading + table, the counterpart to EquipmentDetailSection. Renders
 * nothing when no selected item is usage-billed, so a deal with no printer
 * gets no empty print-pricing section. */
export function PrinterUsageSection({
  selections,
  lang = "bilingual",
  showNote = true,
}: {
  selections: EquipmentSelection[];
  lang?: DocLang;
  showNote?: boolean;
}) {
  if (equipmentOverageTerms(selections).length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 font-semibold">
        <Label
          id="Biaya Cetak: Kuota Dasar, Pemakaian, dan Kelebihan"
          ko="인쇄 요금: 기본 제공 · 사용량 · 초과분"
          lang={lang}
        />
      </h3>
      <PrinterUsageTable selections={selections} lang={lang} showNote={showNote} />
    </div>
  );
}
