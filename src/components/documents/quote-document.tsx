import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { DocTable } from "@/components/documents/doc-table";
import { Bilingual } from "@/components/documents/bilingual-block";
import { renderBilingualQuoteRowLabel } from "@/lib/calc/quote-row-labels";
import { EQUIPMENT_CATEGORY_LABEL } from "@/lib/calc/equipment-category-labels";
import type { Quote } from "@/types/domain";

export function QuoteDocument({
  quote,
  customerName,
  agentName,
  agentPhone,
  agentEmail,
  ppnRate,
}: {
  quote: Quote;
  customerName: string;
  agentName: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  ppnRate: number;
}) {
  const ppn = Math.round((quote.monthly * ppnRate) / 100);
  const total = quote.monthly + ppn;
  const recurringRows = quote.rows.filter((r) => !r.oneTime);
  const oneTimeRows = quote.rows.filter((r) => r.oneTime);
  const oneTimeSubtotal = oneTimeRows.reduce((sum, r) => sum + r.amount, 0);
  const oneTimePpn = Math.round((oneTimeSubtotal * ppnRate) / 100);
  const oneTimeTotal = oneTimeSubtotal + oneTimePpn;
  const cctvRentalSelected = quote.equipment_selections.some(
    (e) => e.category === "cctv" && e.monthlyRate != null
  );
  const hasRentedEquipment = quote.equipment_selections.some((e) => e.monthlyRate != null);

  return (
    <DocumentShell
      title={<Bilingual id="Penawaran Layanan Managed IT BCT" ko="BCT Managed IT 서비스 견적서" />}
      subtitle={`Quotation No. ${quote.no}`}
      meta={
        <div className="flex flex-col gap-1">
          <p>
            <b>PT. Bumi Cerdas Teknology</b>
          </p>
          <p>Customer: {customerName}</p>
          <p>
            Sales: {agentName}
            {agentPhone && ` · ${agentPhone}`}
            {agentEmail && ` · ${agentEmail}`}
          </p>
          <p>
            <Bilingual
              id={`Masa Kontrak: ${quote.months} bulan (${quote.start_date} s/d penagihan ${quote.billing_date})`}
              ko={`계약기간: ${quote.months}개월 (${quote.start_date} ~ 과금 ${quote.billing_date})`}
            />
          </p>
        </div>
      }
    >
      <DocTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Bilingual id="Layanan" ko="서비스" />
            </TableHead>
            <TableHead className="text-right">
              <Bilingual id="Jumlah/Bulan" ko="월 금액" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recurringRows
            .filter((r) => r.amount !== 0)
            .map((r, i) => {
              const label = renderBilingualQuoteRowLabel(r);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Bilingual id={label.id} ko={label.ko} />
                  </TableCell>
                  <TableCell className="text-right">{formatRupiah(r.amount, "id")}</TableCell>
                </TableRow>
              );
            })}
          <TableRow>
            <TableCell className="font-semibold">
              <Bilingual id="Subtotal Tagihan Bulanan" ko="월 청구액 소계" />
            </TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(quote.monthly, "id")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>PPN {ppnRate}%</TableCell>
            <TableCell className="text-right">{formatRupiah(ppn, "id")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">
              <Bilingual id="Total Tagihan Bulanan" ko="월 청구액 합계" />
            </TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(total, "id")}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </DocTable>

      {oneTimeRows.length > 0 && (
        <div>
          <h3 className="mb-1 font-semibold">
            <Bilingual id="Biaya Satu Kali (Ditagihkan Terpisah)" ko="일회성 항목 (별도 청구)" />
          </h3>
          <DocTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Bilingual id="Item" ko="항목" />
                </TableHead>
                <TableHead className="text-right">
                  <Bilingual id="Jumlah" ko="금액" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oneTimeRows.map((r, i) => {
                const label = renderBilingualQuoteRowLabel(r);
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <Bilingual id={label.id} ko={label.ko} />
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(r.amount, "id")}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="font-semibold">
                  <Bilingual id="Subtotal Biaya Satu Kali" ko="일회성 항목 소계" />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatRupiah(oneTimeSubtotal, "id")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PPN {ppnRate}%</TableCell>
                <TableCell className="text-right">{formatRupiah(oneTimePpn, "id")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">
                  <Bilingual id="Total Biaya Satu Kali" ko="일회성 항목 합계" />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatRupiah(oneTimeTotal, "id")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </DocTable>
        </div>
      )}

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
        <Bilingual
          id="Pemberitahuan Starlink: Layanan internet Starlink didaftarkan atas nama Pelanggan dan Pelanggan membayar langsung biaya ke Starlink. BCT tidak menjual kembali layanan internet Starlink, namun menyediakan dukungan instalasi, konfigurasi jaringan (termasuk pengkabelan segmen router-AP), pengelolaan MikroTik/AP/Hub, pemeliharaan PC serta CCTV (4 unit), dan layanan VPN/pemantauan keamanan."
          ko="Starlink 고지: Starlink 인터넷 서비스는 고객 명의로 가입하고 고객이 직접 Starlink에 요금을 납부합니다. BCT는 Starlink 인터넷 서비스를 재판매하지 않으며, 설치지원·네트워크 구성(라우터-AP 구간 배선공사 포함)·MikroTik/AP/Hub 관리·PC 및 CCTV(4대) 유지보수·VPN/보안관제 서비스를 제공합니다."
        />
      </div>

      {quote.equipment_selections.length > 0 && (
        <div>
          <h3 className="mb-1 font-semibold">
            <Bilingual id="Spesifikasi Perangkat yang Disediakan" ko="제공 장비 사양" />
          </h3>
          <DocTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Bilingual id="Kategori" ko="분류" />
                </TableHead>
                <TableHead>
                  <Bilingual id="Model" ko="모델명" />
                </TableHead>
                <TableHead>
                  <Bilingual id="Spesifikasi" ko="스펙" />
                </TableHead>
                <TableHead className="text-right">
                  <Bilingual id="Jumlah" ko="수량" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.equipment_selections.map((eq, i) => {
                const cat = EQUIPMENT_CATEGORY_LABEL[eq.category];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <Bilingual id={cat.id} ko={cat.ko} />
                    </TableCell>
                    <TableCell>{eq.modelName}</TableCell>
                    <TableCell>
                      {eq.specId && eq.specKo ? (
                        <Bilingual id={eq.specId} ko={eq.specKo} />
                      ) : (
                        eq.specId || eq.specKo || "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{eq.qty}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </DocTable>
        </div>
      )}

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual id="Ketentuan Utama" ko="주요 조건" />
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Bilingual
              id={`Masa kontrak: ${quote.months} bulan. Tanggal mulai layanan: ${quote.start_date}. Tanggal penagihan direncanakan: ${quote.billing_date}.`}
              ko={`계약기간: ${quote.months}개월. 서비스 시작일: ${quote.start_date}. 과금 예정일: ${quote.billing_date}.`}
            />
          </li>
          <li>
            {cctvRentalSelected ? (
              <Bilingual
                id="CCTV pada penawaran ini dibangun/dipasang langsung oleh BCT dan tetap menjadi milik BCT selama masa sewa; biaya sewa bulanan di atas sudah termasuk pemeliharaan. Untuk CCTV lain milik Pelanggan di luar penawaran ini, BCT hanya menyediakan pemeliharaan status operasional/jaringan/rekaman."
                ko="본 견적에 포함된 CCTV는 BCT가 직접 구축·설치하며, 임대 기간 동안 BCT 소유입니다. 위 월 임대료에 유지보수가 포함되어 있습니다. 이 견적에 포함되지 않은 고객 보유 CCTV는 BCT가 작동/네트워크/녹화 상태 유지보수만 제공합니다."
              />
            ) : (
              <Bilingual
                id="Perangkat CCTV dan instalasi baru menjadi tanggung jawab Pelanggan; BCT hanya menyediakan pemeliharaan status operasional/jaringan/rekaman CCTV milik Pelanggan."
                ko="CCTV 장비 및 신규 설치는 고객 부담이며, BCT는 고객 보유 CCTV의 작동/네트워크/녹화 상태 유지보수만 제공합니다."
              />
            )}
          </li>
          {hasRentedEquipment && (
            <li>
              <Bilingual
                id="Perangkat sewa pada tabel spesifikasi di atas (CCTV, printer, dll.) tetap menjadi milik BCT selama masa sewa. Jika kontrak berakhir lebih awal, nilai belum diamortisasi dari perangkat tersebut dapat ditagihkan sesuai ketentuan penalti terminasi."
                ko="위 장비 사양 표에 포함된 임대 장비(CCTV, 프린터 등)는 임대 기간 동안 BCT 소유입니다. 계약이 중도 해지될 경우, 해당 장비의 미상각 잔액은 중도해지 패널티 조항에 따라 정산될 수 있습니다."
              />
            </li>
          )}
          <li>
            <Bilingual
              id="Layanan bulanan mencakup pemeliharaan rutin serta dukungan jarak jauh/lapangan untuk seluruh PC karyawan dan perangkat jaringan yang tercakup dalam kontrak. Biaya suku cadang dan perbaikan akibat kerusakan (di luar pemeliharaan rutin) ditagihkan terpisah berdasarkan biaya riil ditambah biaya penanganan (handling charge)."
              ko="월 서비스 요금에는 계약에 포함된 전 직원 PC 및 네트워크 장비의 정기 유지보수와 원격/방문 지원이 포함됩니다. 고장으로 인한 부품 교체·수리 비용은 정기 유지보수와 별도로, 실제 소요비용 기준 핸들링 챠지만 추가하여 청구됩니다."
            />
          </li>
          <li>
            <Bilingual
              id="VPN, layanan keamanan tambahan, atau layanan lain di luar paket dasar (jika dipilih) tercantum sebagai baris tersendiri pada tabel di atas, lengkap dengan nama, deskripsi, dan harganya masing-masing."
              ko="VPN, 추가 보안 서비스 등 기본 패키지 이외의 서비스가 포함된 경우, 위 표에 별도 항목으로 명칭·설명·요금이 함께 명시됩니다."
            />
          </li>
          <li>
            <Bilingual
              id="Jika kontrak diakhiri lebih awal atas permintaan atau kelalaian Pelanggan, jumlah penyelesaian dihitung sebagai: (a) nilai belum diamortisasi dari biaya perangkat/instalasi yang disediakan BCT × (sisa bulan kontrak ÷ total bulan kontrak); ditambah (b) denda sebesar persentase tertentu dari nilai pada (a) (standar 50%, dapat berbeda sesuai perjanjian); ditambah (c) biaya pembongkaran/penarikan dan administrasi sebesar 8% dari harga awal perangkat; ditambah (d) tagihan yang belum lunas. Rincian penuh tercantum dalam Perjanjian Kerja Sama. Contoh: jika harga awal perangkat Rp10.000.000 dengan sisa 12 dari 24 bulan kontrak, maka (a) = Rp10.000.000 × 12/24 = Rp5.000.000; (b) = 50% × Rp5.000.000 = Rp2.500.000; (c) = 8% × Rp10.000.000 = Rp800.000; sehingga (a)+(b)+(c) = Rp8.300.000, ditambah (d) sesuai kondisi aktual."
              ko="고객 사정 또는 귀책으로 계약을 중도 해지하는 경우, 정산금액은 (a) BCT가 제공한 장비/설치비의 미상각 잔액 × (계약 잔여개월 ÷ 총 계약개월); 여기에 (b) (a) 금액의 일정 비율(기본 50%, 계약에 따라 다를 수 있음)에 해당하는 위약금을 더하고, (c) 장비 원가의 8%에 해당하는 철거·회수·행정비를 더하고, (d) 미납요금을 더하여 산정합니다. 상세 내용은 서비스 계약서에 명시됩니다. 예시: 장비 원가가 Rp10,000,000이고 24개월 계약 중 12개월이 남은 경우, (a) = Rp10,000,000 × 12/24 = Rp5,000,000; (b) = Rp5,000,000의 50% = Rp2,500,000; (c) = Rp10,000,000의 8% = Rp800,000; 따라서 (a)+(b)+(c) = Rp8,300,000이며, 여기에 실제 상황에 따른 (d)가 추가됩니다."
            />
          </li>
          {hasRentedEquipment && (
            <li>
              <Bilingual
                id="Meskipun masa kontrak telah berakhir, kepemilikan perangkat sewa yang disediakan BCT tetap menjadi milik BCT. Dalam hal ini, biaya sewa yang ditagihkan adalah sebesar 70% dari tarif sewa semula. (Kecuali printer — biaya sewanya tetap sama meskipun masa kontrak telah berakhir.)"
                ko="계약기간이 종료된 이후에도 BCT가 제공한 임대장비의 소유권은 BCT에 있습니다. 이 경우 임대료는 기존 임대료의 70% 금액으로 청구됩니다. (단, 프린터는 제외되며 계약기간이 지나도 임대비용은 동일합니다.)"
              />
            </li>
          )}
          <li>
            <Bilingual
              id="Penggantian komponen, lisensi, consumable, pekerjaan pengkabelan skala besar, pemulihan data, dan penanganan insiden keamanan serius memerlukan penawaran terpisah."
              ko="부품 교체, 라이선스, 소모품, 대규모 배선공사, 데이터복구, 심각한 보안사고 복구는 별도 견적입니다."
            />
          </li>
          <li>
            <Bilingual
              id="Penawaran ini belum termasuk PPN dan dapat disesuaikan berdasarkan hasil survei lokasi."
              ko="본 견적은 PPN 별도이며, 현장 실사 결과에 따라 조정될 수 있습니다."
            />
          </li>
        </ol>
      </div>
    </DocumentShell>
  );
}
