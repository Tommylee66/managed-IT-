import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { DocumentShell } from "@/components/documents/document-shell";
import type { Invoice } from "@/types/domain";

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
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
              <TableCell className="text-right">{formatRupiah(item.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">소계</TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(invoice.subtotal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>PPN</TableCell>
            <TableCell className="text-right">{formatRupiah(invoice.ppn)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold">총 청구금액</TableCell>
            <TableCell className="text-right font-semibold">{formatRupiah(invoice.total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p className="text-muted-foreground">{invoice.memo}</p>
    </DocumentShell>
  );
}
