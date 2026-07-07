import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/data-access/customers";
import { listAgents } from "@/lib/data-access/agents";
import { getRates } from "@/lib/data-access/rates";
import { ApplicationForm } from "@/components/applications/application-form";
import type { Rates } from "@/types/domain";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [customers, agents, rates, t] = await Promise.all([
    listCustomers(supabase, session!.role),
    listAgents(supabase, session!.role),
    getRates(supabase, session!.role) as Promise<Rates>,
    getTranslations("applications"),
  ]);
  const locationNames = rates.locations.map((l) => l.name);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("newApplication")}</h1>
      <ApplicationForm customers={customers} agents={agents} locationNames={locationNames} />
    </div>
  );
}
