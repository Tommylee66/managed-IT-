import { Fragment } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listContracts } from "@/lib/data-access/contracts";
import { listAgents, listAgentsForSession } from "@/lib/data-access/agents";
import {
  calcMonthlyCommissionReport,
  calcAgentCommissionHistory,
} from "@/lib/calc/commission-report";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/config/constants";

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
  if (!session || (session.role !== "master" && session.role !== "sales_agent")) {
    redirect(`/${locale}/dashboard`);
  }

  const { month: monthParam } = await searchParams;
  const month = monthParam || currentMonthKey();
  const supabase = await createClient();
  const t = await getTranslations("agents");

  if (session.role === "sales_agent") {
    const tContracts = await getTranslations("contracts");
    const STATUS_LABEL: Record<string, string> = {
      contracted: tContracts("statusContracted"),
      activated: tContracts("statusActivated"),
      terminated: tContracts("statusTerminated"),
    };

    const [myAgents, contracts] = await Promise.all([
      listAgentsForSession(supabase, session),
      // RLS already restricts these rows to this session's own agent_code
      // (see current_agent_code() policy) — passing 'master' here only
      // bypasses the client-side commission-field masking, which would
      // otherwise NaN out the very numbers this page exists to show.
      listContracts(supabase, "master"),
    ]);
    // Only contracts a master has explicitly confirmed count toward
    // commission — otherwise a not-yet-confirmed (or duplicate/test)
    // contract would show as real, payable commission here too.
    const confirmedContracts = contracts.filter((c) => c.confirmed_at !== null);
    const myAgent = myAgents[0] ?? null;
    const history = myAgent
      ? calcAgentCommissionHistory(confirmedContracts, myAgent.code, month)
      : [];
    const totalToDate = history.reduce((sum, h) => sum + h.totalToDate, 0);
    const activeCount = history.filter((h) => h.status !== "terminated").length;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{t("myCommissionTitle")}</h1>
          <Link href={`/${locale}/dashboard`} className="text-sm underline">
            {t("backToDashboard")}
          </Link>
        </div>

        {!myAgent ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              {t("unlinkedAgentNotice")}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">{t("totalCustomers")}</p>
                  <p className="mt-1 text-xl font-semibold">{history.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">{t("activeContractsCount")}</p>
                  <p className="mt-1 text-xl font-semibold">{activeCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">{t("totalCommissionToDate")}</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatRupiah(totalToDate, locale as Locale)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("myCommissionSubtitle", { month })}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {history.length === 0 && (
                  <p className="py-6 text-center text-muted-foreground">{t("noCustomersYet")}</p>
                )}
                {history.map((h) => (
                  <div key={h.contractNo} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/${locale}/contracts/${h.contractNo}`}
                          className="font-medium hover:underline"
                        >
                          {h.customerName}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">{h.contractNo}</span>
                      </div>
                      <Badge variant={h.status === "terminated" ? "secondary" : "default"}>
                        {STATUS_LABEL[h.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">{t("commissionStartDate")}: </span>
                        {h.startDate}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("commissionFullRate")}: </span>
                        {formatRupiah(h.monthlyCommission, locale as Locale)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("commissionHalfRate")}: </span>
                        {formatRupiah(h.halfMonthlyCommission, locale as Locale)}
                      </div>
                      <div className="font-medium">
                        <span className="text-muted-foreground">{t("commissionTotalToDate")}: </span>
                        {formatRupiah(h.totalToDate, locale as Locale)}
                      </div>
                    </div>
                    {h.history.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                          {t("viewMonthlyHistory", { count: h.history.length })}
                        </summary>
                        <Table className="mt-2">
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("historyMonth")}</TableHead>
                              <TableHead className="text-right">{t("historyAmount")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {h.history.map((entry) => (
                              <TableRow key={entry.month}>
                                <TableCell>{entry.month}</TableCell>
                                <TableCell className="text-right">
                                  {formatRupiah(entry.amount, locale as Locale)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </details>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  const [contracts, agents] = await Promise.all([
    listContracts(supabase, "master"),
    listAgents(supabase, "master"),
  ]);
  const npwpByAgentCode = new Map(agents.map((a) => [a.code, a.npwp]));
  // Same confirmed-only rule as the sales_agent view above — a master's
  // payout report shouldn't include commission for contracts nobody has
  // confirmed yet.
  const confirmedContracts = contracts.filter((c) => c.confirmed_at !== null);

  const groups = calcMonthlyCommissionReport(confirmedContracts, month, npwpByAgentCode);
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
              {t("downloadExcel")}
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
                <TableHead>{t("npwp")}</TableHead>
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
                      <TableCell>{g.npwp || "-"}</TableCell>
                      <TableCell>
                        <Link href={`/${locale}/contracts/${r.contractNo}`} className="hover:underline">
                          {r.contractNo}
                        </Link>
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.amount, locale as Locale)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={5}>{t("agentSubtotal", { name: g.agentName })}</TableCell>
                    <TableCell className="text-right">{formatRupiah(g.subtotal, locale as Locale)}</TableCell>
                  </TableRow>
                </Fragment>
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("noCommission")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {groups.length > 0 && (
            <div className="mt-3 flex justify-end gap-2 text-base font-semibold">
              <span>{t("grandTotal")}</span>
              <span>{formatRupiah(grandTotal, locale as Locale)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
