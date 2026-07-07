import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getQuoteRaw } from "@/lib/data-access/quotes";
import { getCustomerRaw } from "@/lib/data-access/customers";
import { getAgent } from "@/lib/data-access/agents";
import { getRates } from "@/lib/data-access/rates";
import { QuoteDocument } from "@/components/documents/quote-document";
import type { Rates } from "@/types/domain";

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const quote = await getQuoteRaw(supabase, no);
  if (!quote) notFound();

  const [customer, agent, rates] = await Promise.all([
    getCustomerRaw(supabase, quote.customer_code),
    quote.agent_code ? getAgent(supabase, quote.agent_code, "master") : null,
    getRates(supabase, "master") as Promise<Rates>,
  ]);

  return (
    <QuoteDocument
      quote={quote}
      customerName={customer?.name ?? quote.customer_code}
      agentName={agent?.name ?? "-"}
      ppnRate={rates.ppn}
    />
  );
}
