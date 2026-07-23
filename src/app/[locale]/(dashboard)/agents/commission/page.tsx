import { Fragment } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listContracts } from "@/lib/data-access/contracts";
import { calcMonthlyCommissionReport } from "@/lib/calc/commission-report";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AgentCommissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect(`/${locale}/dashboard`);

  const { month: monthParam } = await searchParams;
  const month = monthParam || currentMonthKey();

  const supabase = await createClient();
  const [contracts, t] = await Promise.all([listContracts(supabase, "master"), getTranslations("agents")]);

  const groups = calcMonthlyCommissionReport(contracts, month);
  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("commissionReportTitle")}</h1>
        <Link href={`/${locale}/agents`} className="text-sm underline">
          {t("backToAgents")}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("selectMonth")}</CardTitle>
          <CardAction>
            <a
              href={`/api/agents/commission?month=${month}`}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-secondary"
            >
              {t("downloadCsv")}
            </a>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex items-end gap-2">
            <Input type="month" name="month" defaultValue={month} className="w-40" />
            <Button type="submit" variant="outline">
              {t("apply")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("commissionReportSubtitle", { month })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("code")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("commissionContractNo")}</TableHead>
                <TableHead>{t("commissionCustomerName")}</TableHead>
                <TableHead className="text-right">{t("commissionAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <Fragment key={g.agentCode}>
                  {g.rows.map((r) => (
                    <TableRow key={r.contractNo}>
                      <TableCell>{g.agentCode}</TableCell>
                      <TableCell>{g.agentName}</TableCell>
                      <TableCell>
                        <Link href={`/${locale}/contracts/${r.contractNo}`} className="hover:underline">
                          {r.contractNo}
                        </Link>
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4}>{t("agentSubtotal", { name: g.agentName })}</TableCell>
                    <TableCell className="text-right">{formatRupiah(g.subtotal)}</TableCell>
                  </TableRow>
                </Fragment>
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noCommission")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {groups.length > 0 && (
            <div className="mt-3 flex justify-end gap-2 text-base font-semibold">
              <span>{t("grandTotal")}</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
