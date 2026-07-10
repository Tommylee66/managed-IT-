import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/data-access/customers";
import { listAgents } from "@/lib/data-access/agents";
import { getRates } from "@/lib/data-access/rates";
import { listEquipmentCatalog } from "@/lib/data-access/equipment";
import { QuoteCalculatorForm } from "@/components/quotes/quote-calculator-form";

export default async function NewQuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [customers, agents, rates, equipmentCatalog, t] = await Promise.all([
    listCustomers(supabase, session!.role),
    listAgents(supabase, session!.role),
    getRates(supabase, session!.role),
    listEquipmentCatalog(supabase, { activeOnly: true }),
    getTranslations("quotes"),
  ]);
  const locationNames = rates.locations.map((l) => l.name);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("newQuote")}</h1>
      <QuoteCalculatorForm
        customers={customers}
        agents={agents}
        locationNames={locationNames}
        equipmentCatalog={equipmentCatalog}
      />
    </div>
  );
}
