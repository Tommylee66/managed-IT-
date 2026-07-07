import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getRates } from "@/lib/data-access/rates";
import type { Rates } from "@/types/domain";
import { EditRatesForm } from "@/components/rates/edit-rates-form";

export default async function AdminRatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [rates, t] = await Promise.all([
    getRates(supabase, "master") as Promise<Rates>,
    getTranslations("admin"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("ratesTitle")}</h1>
      <EditRatesForm rates={rates} />
    </div>
  );
}
