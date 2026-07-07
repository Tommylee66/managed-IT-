import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getContractRaw } from "@/lib/data-access/contracts";
import { ContractDocument } from "@/components/documents/contract-document";

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

  return (
    <ContractDocument
      contract={contract}
      customerName={contract.customer_name}
      agentName={contract.agent_name ?? "-"}
    />
  );
}
