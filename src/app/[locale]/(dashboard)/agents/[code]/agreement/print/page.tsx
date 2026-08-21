import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/data-access/agents";
import { AgentAgreementDocument } from "@/components/documents/agent-agreement-document";

export default async function AgentAgreementPrintPage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const { code, locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  // Print documents always render unmasked data — see contracts/[no]/print's
  // identical use of the literal "master" role string. RLS (row access) is
  // the real authorization boundary; this only bypasses the display-layer
  // masking that would otherwise redact the agent's own bank/tax info,
  // which the printed agreement needs in full.
  const agent = await getAgent(supabase, code, "master");
  if (!agent) notFound();

  return <AgentAgreementDocument agent={agent} />;
}
