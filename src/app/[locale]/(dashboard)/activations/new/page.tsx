import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listContracts } from "@/lib/data-access/contracts";
import { ActivationForm } from "@/components/activations/activation-form";

export default async function NewActivationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ contract?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { contract } = await searchParams;
  const session = await getSessionContext();
  const supabase = await createClient();
  const [contracts, t] = await Promise.all([
    listContracts(supabase, session!.role),
    getTranslations("activations"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("newActivation")}</h1>
      <ActivationForm contracts={contracts} defaultContractNo={contract} />
    </div>
  );
}
