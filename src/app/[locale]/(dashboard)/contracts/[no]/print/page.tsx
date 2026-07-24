import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getContractRaw } from "@/lib/data-access/contracts";
import { getRates } from "@/lib/data-access/rates";
import { getAgent } from "@/lib/data-access/agents";
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
  const [rates, agent] = await Promise.all([
    getRates(supabase, "master") as Promise<Rates>,
    contract.agent_code ? getAgent(supabase, contract.agent_code, "master") : null,
  ]);

  return (
    <ContractDocument
      contract={contract}
      customerName={contract.customer_name}
      agentName={contract.agent_name ?? "-"}
      agentPhone={agent?.phone}
      agentEmail={agent?.email}
      ppnRate={rates.ppn}
    />
  );
}
