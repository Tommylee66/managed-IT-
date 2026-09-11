import { format, addDays } from "date-fns";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getRates } from "@/lib/data-access/rates";
import { listCustomers } from "@/lib/data-access/customers";
import { listBillableContracts, listInvoicesByCustomer } from "@/lib/data-access/invoices";
import { InvoiceBatchTable } from "@/components/invoices/invoice-batch-table";
import { CustomerInvoiceHistory } from "@/components/invoices/customer-invoice-history";
import type { Rates } from "@/types/domain";

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; date?: string; dueDate?: string; customer?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const today = new Date();
  const month = query.month ?? format(today, "yyyy-MM");
  const date = query.date ?? format(today, "yyyy-MM-dd");
  const dueDate = query.dueDate ?? format(addDays(today, 14), "yyyy-MM-dd");

  const session = await getSessionContext();
  const supabase = await createClient();
  const [rates, customers] = await Promise.all([
    getRates(supabase, "master") as Promise<Rates>,
    listCustomers(supabase, session!.role),
  ]);
  const selectedCustomerCode = customers.some((customer) => customer.code === query.customer)
    ? query.customer!
    : "";
  const [rows, customerInvoices] = await Promise.all([
    listBillableContracts(supabase, month, rates.ppn),
    selectedCustomerCode
      ? listInvoicesByCustomer(supabase, selectedCustomerCode, session!.role)
      : Promise.resolve([]),
  ]);

  const customerOptions = customers
    .map(({ code, name }) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const invoiceHistory = customerInvoices.map((invoice) => ({
    no: invoice.no,
    contractNo: invoice.contract_no,
    month: invoice.month,
    date: invoice.date,
    dueDate: invoice.due_date,
    total: invoice.total,
    paidAmount: invoice.paid_amount,
    sentAt: invoice.sent_at,
  }));

  return (
    <div className="flex flex-col gap-4">
      <InvoiceBatchTable rows={rows} month={month} date={date} dueDate={dueDate} />
      <CustomerInvoiceHistory
        customers={customerOptions}
        customerCode={selectedCustomerCode}
        invoices={invoiceHistory}
        month={month}
        date={date}
        dueDate={dueDate}
      />
    </div>
  );
}
