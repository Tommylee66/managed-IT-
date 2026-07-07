import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getContractRaw } from "@/lib/data-access/contracts";
import { getRates } from "@/lib/data-access/rates";
import { ChangeRequestForm } from "@/components/change-requests/change-request-form";
import type { Rates } from "@/types/domain";

export default async function NewChangeRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ contract?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { contract: contractNo } = await searchParams;
  if (!contractNo) notFound();

  const supabase = await createClient();
  const contract = await getContractRaw(supabase, contractNo);
  if (!contract) notFound();

  const [rates, t] = await Promise.all([
    getRates(supabase, "master") as Promise<Rates>,
    getTranslations("changeRequests"),
  ]);
  const locationNames = rates.locations.map((l) => l.name);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("formTitle", { no: contract.no })}</h1>
      <ChangeRequestForm contract={contract} locationNames={locationNames} />
    </div>
  );
}
