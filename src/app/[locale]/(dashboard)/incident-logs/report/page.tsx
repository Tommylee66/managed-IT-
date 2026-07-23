import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/data-access/customers";
import { MonthlyReportForm } from "@/components/incident-logs/monthly-report-form";

export default async function IncidentMonthlyReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [customers, t] = await Promise.all([
    listCustomers(supabase, session!.role),
    getTranslations("incidentLogs"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("monthlyReportTitle")}</h1>
      <MonthlyReportForm customers={customers} />
    </div>
  );
}
