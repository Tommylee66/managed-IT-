import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getContract } from "@/lib/data-access/contracts";
import { listAssetsByContract } from "@/lib/data-access/assets";
import { getInvoiceByContractMonth } from "@/lib/data-access/invoices";
import { getRates } from "@/lib/data-access/rates";
import { calcContractCommissionForMonth } from "@/lib/calc/commission-report";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmContractButton } from "@/components/contracts/confirm-contract-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Locale } from "@/config/constants";
import type { Rates } from "@/types/domain";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const contract = await getContract(supabase, no, session!.role);
  if (!contract) notFound();

  const thisMonth = currentMonthKey();
  const [assets, t, tCommon, tAssets, thisMonthInvoice, rates] = await Promise.all([
    listAssetsByContract(supabase, no, session!.role),
    getTranslations("contracts"),
    getTranslations("common"),
    getTranslations("assets"),
    getInvoiceByContractMonth(supabase, no, thisMonth),
    getRates(supabase, "master") as Promise<Rates>,
  ]);
  const commissionHidden = Number.isNaN(contract.commission_rate);
  // Commission is no longer a single fixed figure for the whole contract —
  // it's computed live per invoiced month, from the actual billed amount and
  // how much of that invoice was actually paid (see
  // calcContractCommissionForMonth in commission-report.ts). null means no
  // invoice has been issued yet for the current month.
  const thisMonthCommission = thisMonthInvoice
    ? calcContractCommissionForMonth(contract, thisMonth, thisMonthInvoice, rates.commission_items as unknown as Record<string, boolean>)
    : null;
  const thisMonthPaidAmount = thisMonthInvoice?.paid_amount ?? 0;
  const thisMonthPaymentLabel = !thisMonthInvoice
    ? null
    : thisMonthPaidAmount <= 0
      ? t("commissionUnpaid")
      : thisMonthPaidAmount >= thisMonthInvoice.total
        ? t("commissionPaidInFull")
        : t("commissionPartiallyPaid");

  const STATUS_LABEL: Record<string, string> = {
    contracted: t("statusContracted"),
    activated: t("statusActivated"),
    terminated: t("statusTerminated"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {t("detailTitle")} {contract.no}
          </h1>
          <Badge variant={contract.status === "activated" ? "default" : "secondary"}>
            {STATUS_LABEL[contract.status]}
          </Badge>
          <Badge variant={contract.confirmed_at ? "default" : "outline"}>
            {contract.confirmed_at ? t("confirmedBadge") : t("unconfirmedBadge")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!contract.confirmed_at && session!.role === "master" && (
            <ConfirmContractButton contractNo={contract.no} />
          )}
          <Button variant="outline" asChild>
            <Link href={`/${locale}/contracts/${contract.no}/print`}>{t("printContract")}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("customer")}</p>
            <p>{contract.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("salesAgent")}</p>
            <p>{contract.agent_name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("monthlyBilling")}</p>
            <p>{formatRupiah(contract.monthly_fee, locale as Locale)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("period")}</p>
            <p>
              {contract.start_date} ~ {contract.end_date} ({tCommon("months", { count: contract.months })})
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("billingStartDate")}</p>
            <p>{contract.billing_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("activationDate")}</p>
            <p>{contract.activation_date ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("salesCommission")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {commissionHidden ? (
            <p className="col-span-4 text-muted-foreground">{tCommon("masterOnly")}</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">{t("commissionRate")}</p>
                <p>{contract.commission_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("thisMonthCommission", { month: thisMonth })}</p>
                <p>
                  {thisMonthCommission != null
                    ? formatRupiah(thisMonthCommission, locale as Locale)
                    : t("noInvoiceThisMonth")}
                </p>
              </div>
              {thisMonthPaymentLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">{t("commissionPaymentStatus")}</p>
                  <p>{thisMonthPaymentLabel}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {contract.status === "contracted" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("activationProcessing")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${locale}/activations/new?contract=${contract.no}`}>{t("registerActivation")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {contract.status !== "terminated" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("changeRequest")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/change-requests/new?contract=${contract.no}`}>
                {t("registerChangeRequest")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {contract.status !== "terminated" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("terminationProcessing")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" asChild>
              <Link href={`/${locale}/termination/new?contract=${contract.no}`}>{t("requestTermination")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("installedAssets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tAssets("assetNo")}</TableHead>
                <TableHead>{tAssets("type")}</TableHead>
                <TableHead>{tAssets("owner")}</TableHead>
                <TableHead>{tAssets("equipmentModel")}</TableHead>
                <TableHead>{tAssets("qty")}</TableHead>
                <TableHead>{tAssets("condition")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.asset_id}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}</TableCell>
                  <TableCell>
                    {a.name}
                    {a.model ? ` / ${a.model}` : ""}
                  </TableCell>
                  <TableCell>{a.qty}</TableCell>
                  <TableCell>{a.condition}</TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("noAssets")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
