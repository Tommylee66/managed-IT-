import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listContracts } from "@/lib/data-access/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TerminationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [contracts, t] = await Promise.all([
    listContracts(supabase, session!.role),
    getTranslations("termination"),
  ]);
  const terminated = contracts.filter((c) => c.status === "terminated");
  const active = contracts.filter((c) => c.status !== "terminated");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <h2 className="mb-2 text-sm font-bold text-[#4b5d72]">{t("terminatableContracts")}</h2>
        <ul className="flex flex-col gap-1">
          {active.map((c) => (
            <li key={c.no}>
              <Link href={`/${locale}/termination/new?contract=${c.no}`} className="hover:underline">
                {c.no} - {c.customer_name}
              </Link>
            </li>
          ))}
          {active.length === 0 && <p className="text-muted-foreground">{t("noTerminatable")}</p>}
        </ul>
      </CardContent>
      <CardContent>
        <h2 className="mb-2 text-sm font-bold text-[#4b5d72]">{t("terminatedContracts")}</h2>
        <ul className="flex flex-col gap-1">
          {terminated.map((c) => (
            <li key={c.no}>
              <Link href={`/${locale}/contracts/${c.no}`} className="hover:underline">
                {c.no} - {c.customer_name}
              </Link>
            </li>
          ))}
          {terminated.length === 0 && <p className="text-muted-foreground">{t("noTerminated")}</p>}
        </ul>
      </CardContent>
    </Card>
  );
}
