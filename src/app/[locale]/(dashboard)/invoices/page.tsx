import { format, addDays } from "date-fns";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getRates } from "@/lib/data-access/rates";
import { listBillableContracts } from "@/lib/data-access/invoices";
import { InvoiceBatchTable } from "@/components/invoices/invoice-batch-table";
import type { Rates } from "@/types/domain";

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; date?: string; dueDate?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const today = new Date();
  const month = query.month ?? format(today, "yyyy-MM");
  const date = query.date ?? format(today, "yyyy-MM-dd");
  const dueDate = query.dueDate ?? format(addDays(today, 14), "yyyy-MM-dd");

  const supabase = await createClient();
  const rates = (await getRates(supabase, "master")) as Rates;
  const rows = await listBillableContracts(supabase, month, rates.ppn);

  return <InvoiceBatchTable rows={rows} month={month} date={date} dueDate={dueDate} />;
}
