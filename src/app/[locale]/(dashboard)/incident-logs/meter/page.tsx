import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/data-access/customers";
import { MeterReadingForm } from "@/components/incident-logs/meter-reading-form";

export default async function MeterReadingPage({
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
    getTranslations("meterReadings"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("lede")}</p>
      <MeterReadingForm customers={customers} />
    </div>
  );
}
