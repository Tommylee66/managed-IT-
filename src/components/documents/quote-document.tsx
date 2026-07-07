import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { Bilingual } from "@/components/documents/bilingual-block";
import { renderBilingualQuoteRowLabel } from "@/lib/calc/quote-row-labels";
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
          id="Pemberitahuan Starlink: Layanan internet Starlink didaftarkan atas nama Pelanggan dan Pelanggan membayar langsung biaya ke Starlink. BCT tidak menjual kembali layanan internet Starlink, namun menyediakan dukungan instalasi, konfigurasi jaringan, pengelolaan MikroTik/AP/Hub, pemeliharaan PC/CCTV, serta layanan VPN/pemantauan keamanan."
          ko="Starlink 고지: Starlink 인터넷 서비스는 고객 명의로 가입하고 고객이 직접 Starlink에 요금을 납부합니다. BCT는 Starlink 인터넷 서비스를 재판매하지 않으며, 설치지원·네트워크 구성·MikroTik/AP/Hub 관리·PC/CCTV 유지보수·VPN/보안관제 서비스를 제공합니다."
        />
      </div>

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
            <Bilingual
              id="Perangkat CCTV dan instalasi baru menjadi tanggung jawab Pelanggan; BCT hanya menyediakan pemeliharaan status operasional/jaringan/rekaman CCTV milik Pelanggan."
              ko="CCTV 장비 및 신규 설치는 고객 부담이며, BCT는 고객 보유 CCTV의 작동/네트워크/녹화 상태 유지보수만 제공합니다."
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
