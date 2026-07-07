import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listContracts } from "@/lib/data-access/contracts";
import { formatRupiah } from "@/lib/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ContractsPage({
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
    getTranslations("contracts"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    contracted: t("statusContracted"),
    activated: t("statusActivated"),
    terminated: t("statusTerminated"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("contractNo")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("salesAgent")}</TableHead>
              <TableHead>{t("monthlyAmount")}</TableHead>
              <TableHead>{t("period")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.no}>
                <TableCell>
                  <Link href={`/${locale}/contracts/${c.no}`} className="font-medium hover:underline">
                    {c.no}
                  </Link>
                </TableCell>
                <TableCell>{c.customer_name}</TableCell>
                <TableCell>{c.agent_name ?? "-"}</TableCell>
                <TableCell>{formatRupiah(c.monthly_fee)}</TableCell>
                <TableCell>
                  {c.start_date} ~ {c.end_date}
                </TableCell>
                <TableCell>
                  <Badge variant={c.status === "activated" ? "default" : "secondary"}>
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {contracts.length === 0 && (
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
