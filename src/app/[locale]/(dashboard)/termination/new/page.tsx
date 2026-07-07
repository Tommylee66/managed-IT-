import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getContractRaw } from "@/lib/data-access/contracts";
import { listAssetsByContract } from "@/lib/data-access/assets";
import { getRates } from "@/lib/data-access/rates";
import { estimatedAssetCost } from "@/lib/calc/termination-calc";
import { TerminationForm } from "@/components/termination/termination-form";
import type { Rates } from "@/types/domain";

export default async function NewTerminationPage({
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

  const session = await getSessionContext();
  const supabase = await createClient();
  const contract = await getContractRaw(supabase, contractNo);
  if (!contract) notFound();

  const [assets, rates, t] = await Promise.all([
    listAssetsByContract(supabase, contractNo, session!.role),
    getRates(supabase, "master") as Promise<Rates>,
    getTranslations("termination"),
  ]);

  const defaultCosts: Record<string, number> = {};
  for (const asset of assets) {
    defaultCosts[asset.id] = estimatedAssetCost(
      asset.type,
      asset.qty,
      rates.init_fields,
      rates.vpn_base
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {t("requestTitle")} — {contract.no}
      </h1>
      <TerminationForm contract={contract} assets={assets} defaultCosts={defaultCosts} />
    </div>
  );
}
