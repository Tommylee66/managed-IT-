import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTerminationPlan } from "@/lib/data-access/termination";
import { TerminationNoticeDocument } from "@/components/documents/termination-notice-document";

export default async function TerminationPrintPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const plan = await getTerminationPlan(supabase, id, session!.role);
  if (!plan) notFound();

  return <TerminationNoticeDocument plan={plan} />;
}
