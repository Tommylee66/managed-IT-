import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth/session';
import { canAccessPath } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { getCustomer } from '@/lib/data-access/customers';
import { listInvoicesByCustomer } from '@/lib/data-access/invoices';
import { renderInvoiceLineItemLabel } from '@/lib/calc/quote-row-labels';
import { LOCALES, type Locale } from '@/config/constants';
import type { InvoiceLineItem } from '@/lib/calc/invoice-calc';

export const runtime = 'nodejs';

const LABELS: Record<Locale, Record<string, string>> = {
  ko: {
    summarySheet: '청구서 요약', detailSheet: '청구 항목 상세', customerCode: '고객코드', customerName: '고객사명', invoiceNo: '청구서번호', month: '청구월',
    contractNo: '계약번호', issueDate: '발행일', dueDate: '납부기한', subtotal: '소계', ppn: 'PPN',
    total: '총 청구금액', paid: '결제액', outstanding: '미결제액', paymentStatus: '결제상태',
    sentStatus: '발송상태', paidStatus: '결제완료', partialStatus: '부분결제', unpaidStatus: '미결제',
    sent: '발송완료', unsent: '미발송', item: '청구항목', itemAmount: '항목금액',
  },
  en: {
    summarySheet: 'Invoice Summary', detailSheet: 'Line Item Details', customerCode: 'Customer Code', customerName: 'Customer', invoiceNo: 'Invoice No.', month: 'Billing Month',
    contractNo: 'Contract No.', issueDate: 'Issue Date', dueDate: 'Due Date', subtotal: 'Subtotal', ppn: 'VAT',
    total: 'Total', paid: 'Paid Amount', outstanding: 'Outstanding', paymentStatus: 'Payment Status',
    sentStatus: 'Delivery Status', paidStatus: 'Paid', partialStatus: 'Partially Paid', unpaidStatus: 'Unpaid',
    sent: 'Sent', unsent: 'Unsent', item: 'Line Item', itemAmount: 'Amount',
  },
  id: {
    summarySheet: 'Ringkasan Faktur', detailSheet: 'Rincian Item', customerCode: 'Kode Pelanggan', customerName: 'Pelanggan', invoiceNo: 'No. Faktur', month: 'Bulan Penagihan',
    contractNo: 'No. Kontrak', issueDate: 'Tanggal Terbit', dueDate: 'Jatuh Tempo', subtotal: 'Subtotal', ppn: 'PPN',
    total: 'Total', paid: 'Jumlah Dibayar', outstanding: 'Belum Dibayar', paymentStatus: 'Status Pembayaran',
    sentStatus: 'Status Pengiriman', paidStatus: 'Lunas', partialStatus: 'Dibayar Sebagian', unpaidStatus: 'Belum Dibayar',
    sent: 'Terkirim', unsent: 'Belum Terkirim', item: 'Item Tagihan', itemAmount: 'Jumlah',
  },
};

export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  if (!session || !session.isActive || !canAccessPath(session.role, '/invoices')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const customerCode = request.nextUrl.searchParams.get('customerCode')?.trim() ?? '';
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(customerCode)) {
    return NextResponse.json({ error: 'Invalid customer' }, { status: 400 });
  }
  const requestedLocale = request.nextUrl.searchParams.get('locale');
  const locale: Locale = LOCALES.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : 'ko';

  const supabase = await createClient();
  const [customer, invoices] = await Promise.all([
    getCustomer(supabase, customerCode, session.role),
    listInvoicesByCustomer(supabase, customerCode, session.role),
  ]);
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const labels = LABELS[locale];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BCT Total IT Care';
  workbook.created = new Date();

  const summary = workbook.addWorksheet(labels.summarySheet);
  summary.columns = [
    { header: labels.customerCode, key: 'customerCode', width: 16 },
    { header: labels.customerName, key: 'customerName', width: 28 },
    { header: labels.invoiceNo, key: 'invoiceNo', width: 22 },
    { header: labels.month, key: 'month', width: 14 },
    { header: labels.contractNo, key: 'contractNo', width: 22 },
    { header: labels.issueDate, key: 'issueDate', width: 14 },
    { header: labels.dueDate, key: 'dueDate', width: 14 },
    { header: labels.subtotal, key: 'subtotal', width: 18 },
    { header: labels.ppn, key: 'ppn', width: 18 },
    { header: labels.total, key: 'total', width: 18 },
    { header: labels.paid, key: 'paid', width: 18 },
    { header: labels.outstanding, key: 'outstanding', width: 18 },
    { header: labels.paymentStatus, key: 'paymentStatus', width: 18 },
    { header: labels.sentStatus, key: 'sentStatus', width: 16 },
  ];

  for (const invoice of invoices) {
    const paid = invoice.paid_amount ?? 0;
    summary.addRow({
      customerCode: customer.code,
      customerName: customer.name,
      invoiceNo: invoice.no,
      month: invoice.month,
      contractNo: invoice.contract_no ?? '',
      issueDate: invoice.date,
      dueDate: invoice.due_date ?? '',
      subtotal: invoice.subtotal,
      ppn: invoice.ppn,
      total: invoice.total,
      paid,
      outstanding: Math.max(0, invoice.total - paid),
      paymentStatus: paid <= 0 ? labels.unpaidStatus : paid >= invoice.total ? labels.paidStatus : labels.partialStatus,
      sentStatus: invoice.sent_at ? labels.sent : labels.unsent,
    });
  }

  const details = workbook.addWorksheet(labels.detailSheet);
  details.columns = [
    { header: labels.customerCode, key: 'customerCode', width: 16 },
    { header: labels.customerName, key: 'customerName', width: 28 },
    { header: labels.invoiceNo, key: 'invoiceNo', width: 22 },
    { header: labels.month, key: 'month', width: 14 },
    { header: labels.contractNo, key: 'contractNo', width: 22 },
    { header: labels.item, key: 'item', width: 50 },
    { header: labels.itemAmount, key: 'amount', width: 18 },
  ];

  for (const invoice of invoices) {
    for (const item of invoice.items as unknown as InvoiceLineItem[]) {
      details.addRow({
        customerCode: customer.code,
        customerName: customer.name,
        invoiceNo: invoice.no,
        month: invoice.month,
        contractNo: invoice.contract_no ?? '',
        item: renderInvoiceLineItemLabel(item, locale),
        amount: item.amount,
      });
    }
  }

  for (const sheet of [summary, details]) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + sheet.columnCount)}1` };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  }
  ['subtotal', 'ppn', 'total', 'paid', 'outstanding'].forEach((key) => {
    summary.getColumn(key).numFmt = '#,##0';
  });
  details.getColumn('amount').numFmt = '#,##0';

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="billing-${customer.code}.xlsx"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
