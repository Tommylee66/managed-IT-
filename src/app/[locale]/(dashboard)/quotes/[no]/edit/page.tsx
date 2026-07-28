import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getQuote } from "@/lib/data-access/quotes";
import { listCustomers } from "@/lib/data-access/customers";
import { listAgents } from "@/lib/data-access/agents";
import { getRates } from "@/lib/data-access/rates";
import { listEquipmentCatalog } from "@/lib/data-access/equipment";
import { listServiceCatalog } from "@/lib/data-access/services";
import { QuoteCalculatorForm } from "@/components/quotes/quote-calculator-form";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const quote = await getQuote(supabase, no, session!.role);
  if (!quote) notFound();

  const [customers, agents, rates, equipmentCatalog, serviceCatalog, t] = await Promise.all([
    listCustomers(supabase, session!.role),
    listAgents(supabase, session!.role),
    getRates(supabase, session!.role),
    // Not activeOnly — this quote may already have selections pointing at
    // equipment/services that were deactivated since it was created. The
    // selector components hide inactive items UNLESS they're already
    // selected, so staff can still see and remove them here.
    listEquipmentCatalog(supabase, {}),
    listServiceCatalog(supabase, {}),
    getTranslations("quotes"),
  ]);
  const locationNames = rates.locations.map((l) => l.name);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {t("editQuote")} {quote.no}
      </h1>
      <QuoteCalculatorForm
        customers={customers}
        agents={agents}
        locationNames={locationNames}
        equipmentCatalog={equipmentCatalog}
        serviceCatalog={serviceCatalog}
        initialValues={{
          no: quote.no,
          customer_code: quote.customer_code,
          agent_code: quote.agent_code,
          start_date: quote.start_date ?? "",
          billing_date: quote.billing_date ?? "",
          months: quote.months,
          inputs: quote.inputs,
          equipment_selections: quote.equipment_selections,
          service_selections: quote.service_selections,
        }}
      />
    </div>
  );
}
