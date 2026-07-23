import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { Bilingual } from "@/components/documents/bilingual-block";
import type { TerminationPlanView } from "@/lib/data-access/termination";
import type { AssetDecision } from "@/types/domain";

const ACTION_LABEL: Record<string, { id: string; ko: string }> = {
  collect: { id: "Akan Ditarik BCT", ko: "BCT 수거 예정" },
  leave_bill: { id: "Tetap di Pelanggan / Penyelesaian Perangkat", ko: "고객 잔존 / 장비 정산" },
  partial: { id: "Sebagian Ditarik / Sebagian Diselesaikan", ko: "일부 수거 / 일부 정산" },
  close_config: { id: "Penghentian/Nonaktifkan Konfigurasi", ko: "설정 해지/비활성화" },
  remain_customer: { id: "Milik Pelanggan / Bukan Objek Penarikan", ko: "고객 소유 / 수거대상 아님" },
};

function AssetNoticeTable({
  rows,
  emptyText,
}: {
  rows: AssetDecision[];
  emptyText: { id: string; ko: string };
}) {
  if (!rows.length)
    return (
      <div className="rounded-md border p-3 text-muted-foreground">
        <Bilingual id={emptyText.id} ko={emptyText.ko} />
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Bilingual id="Nama Perangkat" ko="장비명" />
          </TableHead>
          <TableHead>
            <Bilingual id="Model" ko="모델" />
          </TableHead>
          <TableHead>
            <Bilingual id="Jumlah" ko="수량" />
          </TableHead>
          <TableHead>
            <Bilingual id="Lokasi Instalasi" ko="설치위치" />
          </TableHead>
          <TableHead>
            <Bilingual id="Tindakan" ko="처리" />
          </TableHead>
          <TableHead className="text-right">
            <Bilingual id="Jumlah Penyelesaian" ko="정산액" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.key}>
            <TableCell>
              {a.name}
              <br />
              <span className="text-xs text-muted-foreground">{a.assetId}</span>
            </TableCell>
            <TableCell>{a.model}</TableCell>
            <TableCell>{a.qty}</TableCell>
            <TableCell>{a.location}</TableCell>
            <TableCell>
              <Bilingual id={ACTION_LABEL[a.action].id} ko={ACTION_LABEL[a.action].ko} />
            </TableCell>
            <TableCell className="text-right">
              {a.action === "leave_bill" || a.action === "partial"
                ? Number.isNaN(a.unamortized)
                  ? "***"
                  : formatRupiah(a.unamortized, "id")
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TerminationNoticeDocument({ plan }: { plan: TerminationPlanView }) {
  const collected = plan.asset_decisions.filter((d) => d.collectQty > 0);
  const remain = plan.asset_decisions.filter((d) => d.action === "remain_customer" || d.billQty > 0);
  const configClose = plan.asset_decisions.filter((d) => d.action === "close_config");
  const penalty =
    plan.unamortizedTotal !== null ? Math.round((plan.unamortizedTotal * plan.penalty_rate) / 100) : null;
  const total =
    plan.unamortizedTotal !== null && penalty !== null
      ? plan.unamortizedTotal + penalty + plan.admin_fee + plan.unpaid
      : null;

  return (
    <DocumentShell
      title={
        <Bilingual
          id="Pemberitahuan Proses Pengakhiran Dini Kontrak"
          ko="중도해지 처리 안내문"
        />
      }
      subtitle={`Contract No. ${plan.contract_no}`}
      meta={
        <div className="flex flex-col gap-2">
          <p>
            <b>PT. Bumi Cerdas Teknology</b>
          </p>
          <div className="flex gap-2">
            <Bilingual id="Nama Pelanggan" ko="고객사" className="w-32 shrink-0" />
            <span>{plan.customer_name}</span>
          </div>
          <div className="flex gap-2">
            <Bilingual id="Tanggal Rencana Pengakhiran" ko="해지 예정일" className="w-32 shrink-0" />
            <span>{plan.term_date}</span>
          </div>
        </div>
      }
    >
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
        <Bilingual
          id="Pemberitahuan ini bertujuan untuk menyampaikan perkiraan denda dan standar penanganan perangkat sebelumnya, sehubungan dengan permintaan penghentian layanan sebelum masa kontrak berakhir atau situasi rencana pengakhiran kontrak Pelanggan. Tagihan akhir sebenarnya akan ditetapkan setelah hasil penarikan perangkat, tagihan yang belum lunas, kondisi kerusakan/kehilangan perangkat, serta konfirmasi kedua belah pihak."
          ko="본 안내문은 고객사의 계약기간 만료 전 서비스 해지 요청 또는 해지 예정 상황에 따라 예상 패널티 및 장비 처리 기준을 사전 고지하기 위한 문서입니다. 실제 최종 청구액은 장비 회수 결과, 미납 요금, 장비 손상/분실 여부 및 양 당사자 확인 후 확정됩니다."
        />
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual id="1. Dasar Kontrak dan Pengakhiran" ko="1. 계약 및 해지 기준" />
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                <Bilingual id="Nama Pelanggan" ko="고객사" />
              </TableCell>
              <TableCell>{plan.customer_name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Bilingual id="Nomor Kontrak" ko="계약번호" />
              </TableCell>
              <TableCell>{plan.contract_no}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Bilingual id="Tanggal Rencana Pengakhiran" ko="해지 예정일" />
              </TableCell>
              <TableCell>{plan.term_date}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <Bilingual id="Sisa Masa Kontrak" ko="잔여기간" />
              </TableCell>
              <TableCell>
                {plan.remaining} bulan / {plan.remaining}개월
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual
            id="2. Perangkat/Layanan yang Tetap Berada di Lokasi Pelanggan"
            ko="2. 고객사 현장에 남게 되는 장비/서비스"
          />
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          <Bilingual
            id="Perangkat milik Pelanggan seperti CCTV, Starlink, PC/server tidak menjadi objek penarikan oleh BCT. Selain itu, jika atas permintaan Pelanggan perangkat milik BCT tetap ditinggalkan di lokasi, nilai belum diamortisasi dan denda atas perangkat tersebut akan diselesaikan."
            ko="CCTV, Starlink, PC/서버 등 고객 소유 장비는 BCT 수거대상이 아닙니다. 또한 고객 요청으로 BCT 제공 장비를 현장에 남겨두는 경우 해당 장비의 미상각액과 패널티가 정산됩니다."
          />
        </p>
        <AssetNoticeTable
          rows={remain}
          emptyText={{
            id: "Tidak ada perangkat yang terdaftar untuk ditinggalkan di lokasi Pelanggan.",
            ko: "고객사에 남겨둘 장비가 등록되어 있지 않습니다.",
          }}
        />
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual
            id="3. Perangkat/Konfigurasi yang Akan Ditarik atau Dihentikan oleh BCT"
            ko="3. BCT가 수거하거나 해지 처리할 장비/설정"
          />
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          <Bilingual
            id="Sebagai prinsip, perangkat yang disediakan BCT akan ditarik kembali oleh BCT saat kontrak berakhir/diakhiri. Pelanggan wajib memberikan akses lokasi, kehadiran petugas penghubung, serta akses daya dan rak untuk keperluan penarikan perangkat."
            ko="BCT 제공 장비는 계약 종료/해지 시 BCT가 수거하는 것을 원칙으로 합니다. 고객사는 장비 회수를 위한 현장 접근, 담당자 입회, 전원 및 Rack 접근을 제공해야 합니다."
          />
        </p>
        <AssetNoticeTable
          rows={collected}
          emptyText={{
            id: "Tidak ada perangkat BCT yang terdaftar untuk ditarik.",
            ko: "수거 예정 BCT 장비가 등록되어 있지 않습니다.",
          }}
        />
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual id="4. Penghentian Layanan/Konfigurasi Non-Fisik" ko="4. 비물리 서비스/설정 해지" />
        </h3>
        <AssetNoticeTable
          rows={configClose}
          emptyText={{
            id: "Tidak ada item VPN/konfigurasi yang perlu dinonaktifkan.",
            ko: "비활성화할 VPN/설정 항목이 없습니다.",
          }}
        />
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual id="5. Logika Perhitungan Denda" ko="5. 패널티 계산 로직" />
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Bilingual id="Item" ko="항목" />
              </TableHead>
              <TableHead>
                <Bilingual id="Rumus/Dasar Perhitungan" ko="산식/근거" />
              </TableHead>
              <TableHead className="text-right">
                <Bilingual id="Jumlah" ko="금액" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <Bilingual id="Nilai Belum Diamortisasi atas Perangkat yang Tetap di Pelanggan" ko="고객 잔존 장비 미상각액" />
              </TableCell>
              <TableCell>
                <Bilingual
                  id={`Biaya pokok perangkat BCT yang dipilih Pelanggan untuk tetap tinggal × proporsi sisa ${plan.remaining} bulan`}
                  ko={`고객이 남겨두기로 선택한 BCT 제공 장비 원가 × 잔여 ${plan.remaining}개월 비율`}
                />
              </TableCell>
              <TableCell className="text-right">
                {plan.unamortizedTotal !== null ? formatRupiah(plan.unamortizedTotal, "id") : plan.unamortizedTotalBucket}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Bilingual id="Denda Pengakhiran Dini" ko="조기해지 패널티" />
              </TableCell>
              <TableCell>
                <Bilingual
                  id={`Nilai belum diamortisasi atas perangkat yang tetap di Pelanggan × ${plan.penalty_rate}%`}
                  ko={`고객 잔존 장비 미상각액 × ${plan.penalty_rate}%`}
                />
              </TableCell>
              <TableCell className="text-right">{penalty !== null ? formatRupiah(penalty, "id") : "***"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Bilingual id="Biaya Pembongkaran/Penarikan/Administrasi" ko="철거/회수/행정비" />
              </TableCell>
              <TableCell>
                <Bilingual
                  id="Kunjungan lokasi, penarikan perangkat, backup konfigurasi, penataan hak akun"
                  ko="현장방문, 장비회수, 설정백업, 계정권한 정리"
                />
              </TableCell>
              <TableCell className="text-right">{formatRupiah(plan.admin_fee, "id")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Bilingual id="Tagihan Belum Lunas/Piutang Lainnya" ko="미납 요금/기타 미수금" />
              </TableCell>
              <TableCell>
                <Bilingual id="Jumlah yang diinput" ko="입력 금액" />
              </TableCell>
              <TableCell className="text-right">{formatRupiah(plan.unpaid, "id")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">
                <Bilingual id="Estimasi Tagihan" ko="예상 청구액" />
              </TableCell>
              <TableCell>
                <Bilingual
                  id="Belum termasuk PPN, jumlah perkiraan sebelum penyelesaian akhir"
                  ko="PPN 별도, 최종 정산 전 예고금액"
                />
              </TableCell>
              <TableCell className="text-right font-semibold">
                {total !== null ? formatRupiah(total, "id") : plan.unamortizedTotalBucket}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-1 font-semibold">
          <Bilingual id="6. Catatan Hukum dan Operasional" ko="6. 법적·운영상 유의사항" />
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <Bilingual
              id="BCT bukan ISP, operator telekomunikasi, reseller Starlink, atau agen resmi Starlink, dan layanan Starlink pada prinsipnya didaftarkan atas nama Pelanggan serta dibayar langsung oleh Pelanggan."
              ko="BCT는 ISP, 통신사업자, Starlink 재판매자 또는 Starlink 공식 대리점이 아니며, Starlink 서비스는 고객 명의 가입 및 고객 직접 납부를 원칙으로 합니다."
            />
          </li>
          <li>
            <Bilingual
              id="Denda dalam pemberitahuan ini dihitung terutama berdasarkan bagian belum diamortisasi dari perangkat BCT yang diminta Pelanggan untuk tetap tinggal di lokasi. Perangkat yang berhasil ditarik kembali secara normal oleh BCT tidak termasuk dalam objek penyelesaian perangkat yang tertinggal."
              ko="본 안내문의 패널티는 고객이 현장 잔존을 요청한 BCT 제공 장비의 미상각 부분을 중심으로 산정합니다. BCT가 정상 회수하는 장비는 장비 잔존 정산 대상에서 제외됩니다."
            />
          </li>
          <li>
            <Bilingual
              id="Perangkat yang disediakan BCT adalah objek penarikan, dan jika terjadi kehilangan, kerusakan, pemindahan tanpa izin, atau penolakan pengembalian, biaya penggantian, perbaikan, dan kunjungan tambahan dapat ditagihkan secara terpisah."
              ko="BCT 제공 장비는 회수 대상이며, 분실·훼손·임의 반출·반환 거부가 발생한 경우 교체비, 수리비, 추가 출동비가 별도로 청구될 수 있습니다."
            />
          </li>
          <li>
            <Bilingual
              id="Data, rekaman video, akun, lisensi, dan backup pada perangkat milik Pelanggan menjadi tanggung jawab Pelanggan. Backup data dan serah terima akun yang diperlukan harus diselesaikan sebelum pengakhiran kontrak."
              ko="고객 소유 장비의 데이터, 녹화영상, 계정, 라이선스, 백업은 고객 책임입니다. 해지 전 필요한 데이터 백업과 계정 인수인계를 완료해야 합니다."
            />
          </li>
          <li>
            <Bilingual
              id="Jika terdapat biaya bulanan yang belum lunas, biaya pekerjaan terpisah, biaya komponen, biaya lisensi, biaya kerja malam/hari libur, atau biaya layanan pihak ketiga, semuanya akan ditambahkan pada laporan penyelesaian akhir."
              ko="미납 월요금, 별도 작업비, 부품비, 라이선스비, 야간/휴일 작업비, 제3자 서비스 비용이 있는 경우 최종 정산서에 추가됩니다."
            />
          </li>
          <li>
            <Bilingual
              id="Dokumen ini bukan merupakan faktur pajak/invoice final, melainkan pemberitahuan awal, dan tagihan akhir akan ditetapkan setelah verifikasi berita acara penarikan perangkat dan rincian tunggakan."
              ko="본 문서는 최종 세금계산서/Invoice가 아니라 사전 예고 안내문이며, 최종 청구는 장비회수 확인서 및 미납 내역 확인 후 확정됩니다."
            />
          </li>
        </ol>
      </div>

      {plan.memo && (
        <div>
          <h3 className="mb-1 font-semibold">
            <Bilingual id="7. Catatan untuk Pelanggan" ko="7. 고객 안내 메모" />
          </h3>
          <div className="rounded-md border p-3">{plan.memo}</div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-8">
        <div>
          <p className="font-semibold">PT. Bumi Cerdas Teknology</p>
          <div className="mt-12 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Tanda Tangan yang Berwenang" ko="서명(권한자)" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{plan.customer_name}</p>
          <div className="mt-12 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Konfirmasi Pelanggan" ko="고객 확인" />
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}
