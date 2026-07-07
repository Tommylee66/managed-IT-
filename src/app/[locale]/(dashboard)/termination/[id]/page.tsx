import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getTerminationPlan } from "@/lib/data-access/termination";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryBox } from "@/components/ui/summary-box";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TerminationPlanDetailPage({
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

  const t = await getTranslations("termination");

  const ACTION_LABEL: Record<string, string> = {
    remain_customer: t("actionRemainCustomer"),
    close_config: t("actionCloseConfig"),
    collect: t("actionCollect"),
    leave_bill: t("actionLeaveBill"),
    partial: t("actionPartial"),
  };

  const penalty = Math.round((plan.unamortizedTotal ?? 0) * plan.penalty_rate) / 100;
  const totalExact =
    plan.unamortizedTotal !== null
      ? plan.unamortizedTotal + Math.round((plan.unamortizedTotal * plan.penalty_rate) / 100) + plan.admin_fee + plan.unpaid
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {t("detailTitle")} {plan.id}
        </h1>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/termination/${plan.id}/print`}>{t("printNotice")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("terminationInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("contractNo")}</p>
            <p>{plan.contract_no}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("customer")}</p>
            <p>{plan.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("terminationDate")}</p>
            <p>{plan.term_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("remainingMonths")}</p>
            <p>{t("months", { count: plan.remaining ?? 0 })}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-muted-foreground">{t("notes")}</p>
            <p className="whitespace-pre-wrap">{plan.memo || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("assetHandling")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("equipmentName")}</TableHead>
                <TableHead>{t("totalQty")}</TableHead>
                <TableHead>{t("collectQty")}</TableHead>
                <TableHead>{t("remainingQty")}</TableHead>
                <TableHead className="text-right">{t("unamortizedAmount")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.asset_decisions.map((d) => (
                <TableRow key={d.key}>
                  <TableCell>
                    {d.name}
                    <br />
                    <span className="text-xs text-muted-foreground">{d.assetId}</span>
                  </TableCell>
                  <TableCell>{d.qty}</TableCell>
                  <TableCell>{d.collectQty}</TableCell>
                  <TableCell>{d.billQty}</TableCell>
                  <TableCell className="text-right">
                    {Number.isNaN(d.unamortized) ? t("masked") : formatRupiah(d.unamortized)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ACTION_LABEL[d.action]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryBox
            label={t("estimatedTotal")}
            value={totalExact !== null ? formatRupiah(totalExact) : plan.unamortizedTotalBucket}
            metrics={[
              {
                label: t("unamortizedSettlement"),
                value: plan.unamortizedTotal !== null ? formatRupiah(plan.unamortizedTotal) : plan.unamortizedTotalBucket,
              },
              {
                label: t("earlyTerminationPenalty", { rate: plan.penalty_rate }),
                value: plan.unamortizedTotal !== null ? formatRupiah(penalty) : t("masked"),
              },
              { label: t("removalAdminFee"), value: formatRupiah(plan.admin_fee) },
              { label: t("unpaidFeeLabel"), value: formatRupiah(plan.unpaid) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
