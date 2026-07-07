import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listActivations } from "@/lib/data-access/activations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ActivationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const [activations, t, tContracts] = await Promise.all([
    listActivations(supabase),
    getTranslations("activations"),
    getTranslations("contracts"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    activated: t("statusActivated"),
    pending: t("statusPending"),
    issue: t("statusIssue"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction>
          <Button asChild>
            <Link href={`/${locale}/activations/new`}>{t("newActivation")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("activationDate")}</TableHead>
              <TableHead>{tContracts("contractNo")}</TableHead>
              <TableHead>{t("engineer")}</TableHead>
              <TableHead>{t("installLocation")}</TableHead>
              <TableHead>{t("registeredAssets")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activations.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.date}</TableCell>
                <TableCell>
                  <Link href={`/${locale}/activations/${a.id}`} className="font-medium hover:underline">
                    {a.contract_no}
                  </Link>
                </TableCell>
                <TableCell>{a.engineer || "-"}</TableCell>
                <TableCell>{a.site || "-"}</TableCell>
                <TableCell>{a.asset_summary || "-"}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "activated" ? "default" : "secondary"}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {activations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
