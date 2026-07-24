import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getContractRaw } from "@/lib/data-access/contracts";
import { getRates } from "@/lib/data-access/rates";
import { ContractDocument } from "@/components/documents/contract-document";
import type { Rates } from "@/types/domain";

export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const contract = await getContractRaw(supabase, no);
  if (!contract) notFound();
  const rates = (await getRates(supabase, "master")) as Rates;

  return (
    <ContractDocument
      contract={contract}
      customerName={contract.customer_name}
      agentName={contract.agent_name ?? "-"}
      ppnRate={rates.ppn}
    />
  );
}
