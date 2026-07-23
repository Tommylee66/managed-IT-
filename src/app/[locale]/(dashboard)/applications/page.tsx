import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listApplications } from "@/lib/data-access/applications";
import { formatRupiah } from "@/lib/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/config/constants";

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const [applications, t] = await Promise.all([
    listApplications(supabase),
    getTranslations("applications"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    received: t("statusReceived"),
    quote_ready: t("statusQuoteReady"),
    agreed: t("statusAgreed"),
    contract_ready: t("statusContractReady"),
    open_pending: t("statusOpenPending"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction>
          <Button asChild>
            <Link href={`/${locale}/applications/new`}>{t("newApplication")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("applicationNo")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("source")}</TableHead>
              <TableHead>{t("expectedMonthly")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((a) => (
              <TableRow key={a.no}>
                <TableCell>
                  <Link href={`/${locale}/applications/${a.no}`} className="font-medium hover:underline">
                    {a.no}
                  </Link>
                </TableCell>
                <TableCell>{a.customer_name}</TableCell>
                <TableCell>{a.source}</TableCell>
                <TableCell>{formatRupiah(a.monthly ?? 0, locale as Locale)}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "received" ? "secondary" : "default"}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
