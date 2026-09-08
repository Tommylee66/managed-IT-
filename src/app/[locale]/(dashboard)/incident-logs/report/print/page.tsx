import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getCustomer } from "@/lib/data-access/customers";
import { listContractsByCustomer } from "@/lib/data-access/contracts";
import { listIncidentLogsByCustomerAndMonth } from "@/lib/data-access/incident-logs";
import { MonthlyReportDocument } from "@/components/documents/monthly-report-document";
import type { Contract, EquipmentSelection } from "@/types/domain";

/** Whether a contract's term overlaps the reported month at all. Selected
 * on dates rather than on `status`, because a contract terminated since then
 * still had its equipment installed during the month being reported, while
 * one signed afterwards did not — status only says where the contract
 * stands today. A null end_date is an open-ended term (see
 * getContractEndDate in invoice-calc.ts), so it has no upper bound here. */
function coversMonth(contract: Contract, monthKey: string): boolean {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return contract.start_date <= monthEnd && (!contract.end_date || contract.end_date >= monthStart);
}

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
  const [customer, records, contracts] = await Promise.all([
    getCustomer(supabase, customerCode, session!.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, month),
    listContractsByCustomer(supabase, customerCode, session!.role),
  ]);
  if (!customer) notFound();

  // A customer can hold more than one contract; the same model appearing
  // under two of them is two real rentals, so both rows are kept rather
  // than deduplicated by model.
  const equipmentSelections: EquipmentSelection[] = contracts
    .filter((c) => coversMonth(c, month))
    .flatMap((c) => c.quote_snapshot?.equipment_selections ?? []);

  return (
    <MonthlyReportDocument
      customerName={customer.name}
      month={month}
      records={records}
      equipmentSelections={equipmentSelections}
    />
  );
}
