import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { previewRetention } from "@/lib/data-access/retention";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RetentionPolicyForm } from "@/components/admin/retention-policy-form";

export default async function AdminRetentionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  // Repeated here even though proxy.ts already gates /admin/retention to
  // master — the same belt-and-braces the other two admin pages use, since
  // this one destroys data.
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [policies, t] = await Promise.all([
    previewRetention(supabase),
    getTranslations("retention"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("policiesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RetentionPolicyForm policies={policies} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("notKeptTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{t("notKeptBody")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
