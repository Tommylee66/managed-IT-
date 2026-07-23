import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getQuote } from "@/lib/data-access/quotes";
import { getCustomer } from "@/lib/data-access/customers";
import { getAgent } from "@/lib/data-access/agents";
import { formatRupiah } from "@/lib/utils/currency";
import { renderQuoteRowLabel } from "@/lib/calc/quote-row-labels";
import type { Locale } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateContractButton } from "@/components/quotes/create-contract-button";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const quote = await getQuote(supabase, no, session!.role);
  if (!quote) notFound();

  const [customer, agent, t, tCommon] = await Promise.all([
    getCustomer(supabase, quote.customer_code, session!.role),
    quote.agent_code ? getAgent(supabase, quote.agent_code, session!.role) : null,
    getTranslations("quotes"),
    getTranslations("common"),
  ]);

  const isMasked = Number.isNaN(quote.margin);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t("detailTitle")} {quote.no}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/quotes/${quote.no}/edit`}>{tCommon("edit")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/quotes/${quote.no}/print`}>{tCommon("print")}</Link>
          </Button>
          <CreateContractButton quoteNo={quote.no} disabled={!quote.agent_code} />
        </div>
      </div>
      {!quote.agent_code && (
        <p className="text-sm text-muted-foreground">{t("noAgentWarning")}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("customer")}</p>
            <p>{customer?.name ?? quote.customer_code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("salesAgent")}</p>
            <p>{agent?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("contractPeriod")}</p>
            <p>{tCommon("months", { count: quote.months })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("serviceStartDate")}</p>
            <p>{quote.start_date}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("billingItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("item")}</TableHead>
                <TableHead className="text-right">{t("monthlyAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{renderQuoteRowLabel(r, locale as Locale)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(r.amount, locale as Locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between font-semibold">
              <span>{t("monthlyTotal")}</span>
              <span>{formatRupiah(quote.monthly, locale as Locale)}</span>
            </div>
            {!isMasked ? (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("marginRate")}</span>
                <span>{quote.margin.toFixed(1)}%</span>
              </div>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("marginRate")}</span>
                <span>{tCommon("masterOnly")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
