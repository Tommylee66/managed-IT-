import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { Bilingual } from "@/components/documents/bilingual-block";
import { contractClauses } from "@/components/documents/contract-clauses";
import type { Contract } from "@/types/domain";

export function ContractDocument({
  contract,
  customerName,
  agentName,
}: {
  contract: Contract;
  customerName: string;
  agentName: string;
}) {
  const sections = contractClauses(contract);

  return (
    <DocumentShell
      title={
        <Bilingual id="Perjanjian Layanan Managed IT Outsourcing" ko="IT 아웃소싱 관리 서비스 계약" />
      }
      subtitle={`Contract No. ${contract.no} / Quote No. ${contract.quote_no ?? "-"}`}
      meta={
        <div className="flex flex-col gap-1">
          <p>
            <b>Provider:</b> PT. Bumi Cerdas Teknology
          </p>
          <p>
            <b>Customer:</b> {customerName}
          </p>
          <p>
            <b>Sales:</b> {agentName}
          </p>
        </div>
      }
    >
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Biaya Layanan Bulanan" ko="월 서비스 요금" />
            </TableCell>
            <TableCell>{formatRupiah(contract.monthly_fee, "id")} + PPN</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Masa Kontrak" ko="계약기간" />
            </TableCell>
            <TableCell>
              {contract.start_date} ~ {contract.end_date} ({contract.months} bulan / {contract.months}개월)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Tanggal Mulai Penagihan" ko="과금시작일" />
            </TableCell>
            <TableCell>{contract.billing_date ?? contract.start_date}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.heading.id}>
            <h3 className="mb-1 font-semibold">
              <Bilingual id={section.heading.id} ko={section.heading.ko} />
            </h3>
            <ol className="list-decimal space-y-2 pl-5">
              {section.items.map((item, i) => (
                <li key={i}>
                  <Bilingual id={item.id} ko={item.ko} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-8">
        <div>
          <p className="font-semibold">PT. Bumi Cerdas Teknology</p>
          <div className="mt-12 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Tanda Tangan yang Berwenang" ko="서명(권한자)" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{customerName}</p>
          <div className="mt-12 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Tanda Tangan yang Berwenang" ko="서명(권한자)" />
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}
