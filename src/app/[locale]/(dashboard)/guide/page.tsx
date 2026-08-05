import { setRequestLocale } from "next-intl/server";
import { SalesAgentGuide } from "@/components/guide/sales-agent-guide";

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SalesAgentGuide />;
}
