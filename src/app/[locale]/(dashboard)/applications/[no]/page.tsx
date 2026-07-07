import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getApplication } from "@/lib/data-access/applications";
import { formatRupiah } from "@/lib/utils/currency";
import { renderQuoteRowLabel } from "@/lib/calc/quote-row-labels";
import type { Locale } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConvertToQuoteButton } from "@/components/applications/convert-to-quote-button";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const application = await getApplication(supabase, no);
  if (!application) notFound();

  const [t, tCalc, tCommon] = await Promise.all([
    getTranslations("applications"),
    getTranslations("serviceCalculator"),
    getTranslations("common"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    received: t("statusReceived"),
    quote_ready: t("statusQuoteReady"),
    agreed: t("statusAgreed"),
    contract_ready: t("statusContractReady"),
    open_pending: t("statusOpenPending"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {t("title")} {application.no}
          </h1>
          <Badge>{STATUS_LABEL[application.status]}</Badge>
        </div>
        {!application.quote_no && <ConvertToQuoteButton applicationNo={application.no} />}
        {application.quote_no && (
          <Link href={`/${locale}/quotes/${application.quote_no}`} className="text-sm hover:underline">
            {t("linkedQuote", { no: application.quote_no })}
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("applicationInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("customer")}</p>
            <p>{application.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("source")}</p>
            <p>{application.source}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("expectedStartDate")}</p>
            <p>{application.start_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("contractPeriod")}</p>
            <p>
              {application.months}
              {tCommon("months")}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-muted-foreground">{t("memo")}</p>
            <p className="whitespace-pre-wrap">{application.memo || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("expectedQuote")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCalc("item")}</TableHead>
                <TableHead className="text-right">{tCalc("monthlyAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {application.calc?.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{renderQuoteRowLabel(r, locale as Locale)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between font-semibold text-sm">
            <span>{t("monthlyTotal")}</span>
            <span>{formatRupiah(application.monthly ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
