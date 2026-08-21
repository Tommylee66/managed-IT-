import Image from "next/image";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DocumentShell } from "@/components/documents/document-shell";
import { DocTable } from "@/components/documents/doc-table";
import { Bilingual } from "@/components/documents/bilingual-block";
import { agentAgreementClauses } from "@/components/documents/agent-agreement-clauses";
import type { Agent } from "@/types/domain";

export function AgentAgreementDocument({ agent }: { agent: Agent }) {
  const sections = agentAgreementClauses(agent);
  const bankLine = agent.bank?.bankName
    ? `${agent.bank.bankName} ${agent.bank.accountNumber ?? ""} (${agent.bank.holderName ?? ""})`
    : "-";

  return (
    <DocumentShell
      title={<Bilingual id="Perjanjian Kerja Sama Agen Penjualan" ko="영업대리점 계약서" />}
      subtitle={`Agent Code ${agent.code}`}
      meta={
        <div className="flex flex-col gap-1">
          <p>
            <b>PT. Bumi Cerdas Teknologi</b>
          </p>
          <p>
            <b>Partner:</b> {agent.name}
          </p>
          {(agent.phone || agent.email) && (
            <p>
              <b>Contact:</b> {[agent.phone, agent.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      }
    >
      <DocTable>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Kode Mitra" ko="대리점 코드" />
            </TableCell>
            <TableCell>{agent.code}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Tarif Komisi Saat Ini" ko="현재 수수료율" />
            </TableCell>
            <TableCell>{agent.rate}%</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Alamat" ko="주소" />
            </TableCell>
            <TableCell>{agent.address || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">NPWP</TableCell>
            <TableCell>{agent.npwp || "-"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              <Bilingual id="Rekening Bank" ko="계좌 정보" />
            </TableCell>
            <TableCell>{bankLine}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </DocTable>

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

      <div className="mt-10 grid grid-cols-2 gap-8 print:break-inside-avoid">
        <div>
          <p className="font-semibold">PT. Bumi Cerdas Teknologi</p>
          <Image src="/bct-signature.png" alt="" width={148} height={56} className="mt-2" />
          <div className="mt-1 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Tanda Tangan yang Berwenang" ko="서명(권한자)" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{agent.name}</p>
          <div className="mt-12 border-t pt-1 text-xs text-muted-foreground">
            <Bilingual id="Tanda Tangan yang Berwenang" ko="서명(권한자)" />
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}
