import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { Bilingual } from "@/components/documents/bilingual-block";
import { renderBilingualQuoteRowLabel } from "@/lib/calc/quote-row-labels";
import { EQUIPMENT_CATEGORY_LABEL } from "@/lib/calc/equipment-category-labels";
import type { Quote } from "@/types/domain";

export function QuoteDocument({
  quote,
  customerName,
  agentName,
  ppnRate,
}: {
  quote: Quote;
  customerName: string;
  agentName: string;
  ppnRate: number;
}) {
  const ppn = Math.round((quote.monthly * ppnRate) / 100);
  const total = quote.monthly + ppn;
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
          <p>Sales: {agentName}</p>
        </div>
      }
    >
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
          {quote.rows
            .filter((r) => r.amount !== 0)
            .map((r, i) => {
              const label = renderBilingualQuoteRowLabel(r);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Bilingual id={label.id} ko={label.ko} />
                  </TableCell>
                  <TableCell className="text-right">{formatRupiah(r.amount)}</TableCell>
                </TableRow>
              );
            })}
          <TableRow>
            <TableCell className="font-semibold">
              <Bilingual id="Subtotal Tagihan Bulanan" ko="월 청구액 소계" />
            </TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(quote.monthly)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>PPN {ppnRate}%</TableCell>
            <TableCell className="text-right">{formatRupiah(ppn)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">
              <Bilingual id="Total Tagihan Bulanan" ko="월 청구액 합계" />
            </TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

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
                      {eq.specId || eq.specKo ? (
                        <Bilingual id={eq.specId || "-"} ko={eq.specKo || "-"} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{eq.qty}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
              id="Layanan bulanan mencakup pemeliharaan rutin serta dukungan jarak jauh/lapangan untuk seluruh PC karyawan dan perangkat jaringan yang tercakup dalam kontrak. Biaya suku cadang dan perbaikan akibat kerusakan (di luar pemeliharaan rutin) ditagihkan terpisah sesuai biaya riil (at-cost), tanpa markup."
              ko="월 서비스 요금에는 계약에 포함된 전 직원 PC 및 네트워크 장비의 정기 유지보수와 원격/방문 지원이 포함됩니다. 고장으로 인한 부품 교체·수리 비용은 정기 유지보수와 별도로, 실제 소요 비용(실비) 기준으로 마진 없이 청구됩니다."
            />
          </li>
          <li>
            <Bilingual
              id="VPN dasar menyediakan akses jarak jauh yang aman ke jaringan kantor pusat; VPN cabang (jika dipilih) memperluas akses ini ke lokasi cabang tambahan. Layanan keamanan mencakup pemantauan aktivitas jaringan, atau penyediaan dan pengelolaan perangkat keamanan setingkat FortiGate. Respons prioritas (jika dipilih) memberikan target waktu tanggap insiden yang lebih cepat dari layanan standar."
              ko="기본 VPN은 본사 네트워크에 대한 안전한 원격 접속을 제공하며, 지사 VPN(선택 시)은 이 접속 범위를 추가 지사까지 확장합니다. 보안 서비스는 네트워크 활동 모니터링, 또는 FortiGate급 보안장비의 제공 및 운영관리 중 선택할 수 있습니다. 우선 장애대응(선택 시)은 일반 서비스보다 더 빠른 목표 대응 시간을 제공합니다."
            />
          </li>
          <li>
            <Bilingual
              id="Jika kontrak diakhiri lebih awal atas permintaan atau kelalaian Pelanggan, biaya penalti dihitung dari: (a) nilai belum diamortisasi dari biaya perangkat/instalasi yang disediakan BCT, dihitung proporsional terhadap sisa bulan kontrak; (b) denda sebesar persentase tertentu dari nilai tersebut (standar 50%, dapat berbeda sesuai perjanjian); ditambah (c) biaya pembongkaran/penarikan dan administrasi. Rincian penuh tercantum dalam Perjanjian Kerja Sama."
              ko="고객 사정 또는 귀책으로 계약을 중도 해지하는 경우, 패널티는 (a) BCT가 제공한 장비/설치비의 미상각 잔액을 계약 잔여기간에 비례하여 산정하고, (b) 해당 잔액의 일정 비율(기본 50%, 계약에 따라 다를 수 있음)에 해당하는 벌금을 더하고, (c) 철거·회수비 및 행정비를 합산하여 산정합니다. 상세 내용은 서비스 계약서에 명시됩니다."
            />
          </li>
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
