import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getCustomer } from "@/lib/data-access/customers";
import { listQuotesByCustomer } from "@/lib/data-access/quotes";
import { listContractsByCustomer } from "@/lib/data-access/contracts";
import { listAssetsByCustomer } from "@/lib/data-access/assets";
import { listServiceLogsByCustomer } from "@/lib/data-access/service-logs";
import { listChangeRequestsByCustomer } from "@/lib/data-access/change-requests";
import { listTerminationPlansByCustomer } from "@/lib/data-access/termination";
import { getAgent } from "@/lib/data-access/agents";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditCustomerForm } from "@/components/customers/edit-customer-form";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const { code, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const customer = await getCustomer(supabase, code, session!.role);
  if (!customer) notFound();

  const [quotes, contracts, assets, serviceLogs, changeRequests, terminationPlans, t, tContracts, tCommon, tAssets] =
    await Promise.all([
      listQuotesByCustomer(supabase, code, session!.role),
      listContractsByCustomer(supabase, code, session!.role),
      listAssetsByCustomer(supabase, code, session!.role),
      listServiceLogsByCustomer(supabase, code),
      listChangeRequestsByCustomer(supabase, code),
      listTerminationPlansByCustomer(supabase, code, session!.role),
      getTranslations("customers"),
      getTranslations("contracts"),
      getTranslations("common"),
      getTranslations("assets"),
    ]);
  const customerAgent = customer.agent_code ? await getAgent(supabase, customer.agent_code, session!.role) : null;

  const STATUS_LABEL: Record<string, string> = {
    draft: t("statusDraft"),
    contracted: t("statusContracted"),
    activated: t("statusActivated"),
  };
  const CONTRACT_STATUS_LABEL: Record<string, string> = {
    contracted: tContracts("statusContracted"),
    activated: tContracts("statusActivated"),
    terminated: tContracts("statusTerminated"),
  };

  const currentContract = contracts.find((c) => c.status !== "terminated") ?? contracts[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{customer.name}</h1>
        <Badge variant={customer.status === "activated" ? "default" : "secondary"}>
          {STATUS_LABEL[customer.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("currentStatusTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {currentContract ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">{tContracts("status")}</p>
                <Badge variant={currentContract.status === "terminated" ? "secondary" : "default"}>
                  {CONTRACT_STATUS_LABEL[currentContract.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("monthlyAmount")}</p>
                <p>{formatRupiah(currentContract.monthly_fee)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("contractStartDate")}</p>
                <p>{currentContract.start_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("salesAgent")}</p>
                <p>{currentContract.agent_name || t("noAgent")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("equipmentCount")}</p>
                <p>{assets.length}</p>
              </div>
            </>
          ) : (
            <p className="col-span-2 text-muted-foreground md:col-span-5">{t("noActiveContract")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("code")}</p>
            <p>{customer.code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("taxId")}</p>
            <p>{customer.tax_id || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("contact")}</p>
            <p>{customer.contact || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("phone")}</p>
            <p>{customer.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("email")}</p>
            <p>{customer.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("invoiceEmail")}</p>
            <p>{customer.invoice_email || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("salesAgent")}</p>
            <p>{customerAgent?.name || t("noAgent")}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-muted-foreground">{t("address")}</p>
            <p>{customer.address || "-"}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-muted-foreground">{t("memo")}</p>
            <p className="whitespace-pre-wrap">{customer.memo || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("quoteHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("quoteNo")}</TableHead>
                <TableHead>{t("contractPeriod")}</TableHead>
                <TableHead>{t("monthlyAmount")}</TableHead>
                <TableHead>{t("createdDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.no}>
                  <TableCell>
                    <Link href={`/${locale}/quotes/${q.no}`} className="font-medium hover:underline">
                      {q.no}
                    </Link>
                  </TableCell>
                  <TableCell>{tCommon("months", { count: q.months })}</TableCell>
                  <TableCell>{formatRupiah(q.monthly)}</TableCell>
                  <TableCell>{new Date(q.created_at).toLocaleDateString(locale)}</TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t("noQuotes")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("contractHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("contractNo")}</TableHead>
                <TableHead>{t("monthlyAmount")}</TableHead>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("salesAgent")}</TableHead>
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
                  <TableCell>{formatRupiah(c.monthly_fee)}</TableCell>
                  <TableCell>
                    {c.start_date} ~ {c.end_date}
                  </TableCell>
                  <TableCell>{c.agent_name || t("noAgent")}</TableCell>
                  <TableCell>{CONTRACT_STATUS_LABEL[c.status]}</TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noContracts")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("changeHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("changeDate")}</TableHead>
                <TableHead>{t("changeType")}</TableHead>
                <TableHead>{t("monthlyBefore")}</TableHead>
                <TableHead>{t("monthlyAfter")}</TableHead>
                <TableHead>{t("settlementAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changeRequests.map((cr) => (
                <TableRow key={cr.id}>
                  <TableCell>{cr.effective_date}</TableCell>
                  <TableCell>{cr.type || "-"}</TableCell>
                  <TableCell>{cr.old_monthly != null ? formatRupiah(cr.old_monthly) : "-"}</TableCell>
                  <TableCell>{cr.new_monthly != null ? formatRupiah(cr.new_monthly) : "-"}</TableCell>
                  <TableCell>{cr.settlement_amount != null ? formatRupiah(cr.settlement_amount) : "-"}</TableCell>
                </TableRow>
              ))}
              {changeRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noChangeRequests")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {terminationPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("terminationInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("terminationDate")}</TableHead>
                  <TableHead>{t("remainingMonths")}</TableHead>
                  <TableHead>{t("penaltyRate")}</TableHead>
                  <TableHead>{t("adminFeeLabel")}</TableHead>
                  <TableHead>{t("unamortizedAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminationPlans.map((tp) => (
                  <TableRow key={tp.id}>
                    <TableCell>{tp.term_date}</TableCell>
                    <TableCell>{tp.remaining ?? "-"}</TableCell>
                    <TableCell>{tp.penalty_rate}%</TableCell>
                    <TableCell>{formatRupiah(tp.admin_fee)}</TableCell>
                    <TableCell>
                      {tp.unamortizedTotal != null ? formatRupiah(tp.unamortizedTotal) : tp.unamortizedTotalBucket}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("assetManagement")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tAssets("assetNo")}</TableHead>
                <TableHead>{tAssets("type")}</TableHead>
                <TableHead>{tAssets("owner")}</TableHead>
                <TableHead>{tAssets("equipmentModel")}</TableHead>
                <TableHead>{tAssets("serial")}</TableHead>
                <TableHead>{tAssets("qty")}</TableHead>
                <TableHead>{tAssets("installLocation")}</TableHead>
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
                  <TableCell className="whitespace-pre-line">{a.serial || "-"}</TableCell>
                  <TableCell>{a.qty}</TableCell>
                  <TableCell>{a.location || "-"}</TableCell>
                  <TableCell>{a.condition}</TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {t("noAssets")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("serviceHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("logType")}</TableHead>
                <TableHead>{t("logTitle")}</TableHead>
                <TableHead>{t("content")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.date}</TableCell>
                  <TableCell>{log.type}</TableCell>
                  <TableCell>{log.title || "-"}</TableCell>
                  <TableCell className="whitespace-pre-line">{log.memo || "-"}</TableCell>
                </TableRow>
              ))}
              {serviceLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t("noServiceLogs")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {session!.role === "master" && <EditCustomerForm customer={customer} />}
    </div>
  );
}
