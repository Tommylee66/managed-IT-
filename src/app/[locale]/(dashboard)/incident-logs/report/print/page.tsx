import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getCustomer } from "@/lib/data-access/customers";
import { listIncidentLogsByCustomerAndMonth } from "@/lib/data-access/incident-logs";
import { MonthlyReportDocument } from "@/components/documents/monthly-report-document";

export default async function MonthlyReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ customer?: string; month?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { customer: customerCode, month } = await searchParams;
  if (!customerCode || !month) notFound();

  const session = await getSessionContext();
  const supabase = await createClient();
  const [customer, records] = await Promise.all([
    getCustomer(supabase, customerCode, session!.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, month),
  ]);
  if (!customer) notFound();

  return <MonthlyReportDocument customerName={customer.name} month={month} records={records} />;
}
