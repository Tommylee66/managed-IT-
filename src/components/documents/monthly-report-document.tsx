import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentShell } from "@/components/documents/document-shell";
import { DocTable } from "@/components/documents/doc-table";
import { Bilingual } from "@/components/documents/bilingual-block";
import { bilingualMonthLabel } from "@/lib/utils/date";
import type { IncidentLog } from "@/types/domain";

export function MonthlyReportDocument({
  customerName,
  month,
  records,
}: {
  customerName: string;
  month: string;
  records: IncidentLog[];
}) {
  const incidentCount = records.filter((r) => r.type === "incident").length;
  const inspectionCount = records.filter((r) => r.type === "inspection").length;

  return (
    <DocumentShell
      title={<Bilingual id="Laporan Bulanan Dukungan IT" ko="월간 IT 지원 리포트" />}
      subtitle={bilingualMonthLabel(month)}
      meta={
        <div className="flex flex-col gap-1">
          <p>
            <b>PT. Bumi Cerdas Teknologi</b>
          </p>
          <p>
            <Bilingual id="Pelanggan" ko="고객사" />: {customerName}
          </p>
          <p>
            <Bilingual
              id={`Total ${records.length} kejadian tercatat (${incidentCount} penanganan gangguan, ${inspectionCount} pemeriksaan rutin).`}
              ko={`총 ${records.length}건 기록 (장애처리 ${incidentCount}건, 정기점검 ${inspectionCount}건).`}
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
                <Bilingual id="Tanggal" ko="일자" />
              </TableHead>
              <TableHead>
                <Bilingual id="Jenis" ko="구분" />
              </TableHead>
              <TableHead>
                <Bilingual id="Judul" ko="제목" />
              </TableHead>
              <TableHead>
                <Bilingual id="Deskripsi" ko="상세 내용" />
              </TableHead>
              <TableHead>
                <Bilingual id="Tindakan/Hasil" ko="조치/결과" />
              </TableHead>
              <TableHead>
                <Bilingual id="Petugas" ko="담당자" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.occurred_date}</TableCell>
                <TableCell>
                  {r.type === "incident" ? (
                    <Bilingual id="Penanganan Gangguan" ko="장애처리" />
                  ) : (
                    <Bilingual id="Pemeriksaan Rutin" ko="정기점검" />
                  )}
                </TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell className="whitespace-pre-wrap">{r.description}</TableCell>
                <TableCell className="whitespace-pre-wrap">{r.resolution || "-"}</TableCell>
                <TableCell>{r.engineer || "-"}</TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  <Bilingual
                    id="Tidak ada kejadian yang tercatat pada bulan ini."
                    ko="이번 달 기록된 내용이 없습니다."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DocTable>
    </DocumentShell>
  );
}
