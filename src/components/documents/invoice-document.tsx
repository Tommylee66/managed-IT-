import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import { DocTable } from "@/components/documents/doc-table";
import {
  EquipmentDetailSection,
  PrinterUsageSection,
} from "@/components/documents/equipment-detail-table";
import type { MeteredUsage } from "@/lib/calc/equipment-pricing";
import type { EquipmentSelection, Invoice } from "@/types/domain";

/** equipmentSelections comes from the invoiced contract's quote snapshot,
 * fetched by the print page — the invoice row itself only stores priced
 * line items, so without it the customer sees charges for rented equipment
 * with no statement of what equipment that is. Defaults to empty so an
 * invoice with no linked contract still renders. */
export function InvoiceDocument({
  invoice,
  equipmentSelections = [],
  usageByCatalogId,
}: {
  invoice: Invoice;
  equipmentSelections?: EquipmentSelection[];
  /** This month's actual meter readings — the same ones the line items
   * above were billed from, so the usage breakdown reconciles with the
   * charge instead of restating the quote's estimate. */
  usageByCatalogId?: Map<string, MeteredUsage>;
}) {
  return (
    <DocumentShell
      title="청구서 / Invoice"
      subtitle={`Invoice No. ${invoice.no}`}
      meta={
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>
              <b>고객명</b>: {invoice.customer_name}
            </p>
            <p>
              <b>청구서 이메일</b>: {invoice.recipient_email || "미등록"}
            </p>
          </div>
          <div>
            <p>
              <b>계약번호</b>: {invoice.contract_no}
            </p>
            <p>
              <b>청구월</b>: {invoice.month}
            </p>
            <p>
              <b>발행일</b>: {invoice.date} / <b>납부기한</b>: {invoice.due_date}
            </p>
          </div>
        </div>
      }
    >
      <DocTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>항목</TableHead>
            <TableHead className="text-right">월 금액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.label}</TableCell>
              <TableCell className="text-right">{formatRupiah(item.amount, "ko")}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">소계</TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(invoice.subtotal, "ko")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>PPN</TableCell>
            <TableCell className="text-right">{formatRupiah(invoice.ppn, "ko")}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">총 청구금액</TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(invoice.total, "ko")}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </DocTable>

      <EquipmentDetailSection selections={equipmentSelections} lang="ko" />

      <PrinterUsageSection
        selections={equipmentSelections}
        usageByCatalogId={usageByCatalogId}
        lang="ko"
      />

      <p className="text-muted-foreground">{invoice.memo}</p>
    </DocumentShell>
  );
}
