import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listQuotes } from "@/lib/data-access/quotes";
import { listCustomers } from "@/lib/data-access/customers";
import { formatRupiah } from "@/lib/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/config/constants";

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [quotes, customers, t, tCommon] = await Promise.all([
    listQuotes(supabase, session!.role),
    listCustomers(supabase, session!.role),
    getTranslations("quotes"),
    getTranslations("common"),
  ]);
  const customerName = (code: string) => customers.find((c) => c.code === code)?.name ?? code;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction>
          <Button asChild>
            <Link href={`/${locale}/quotes/new`}>{t("newQuote")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("quoteNo")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
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
                <TableCell>{customerName(q.customer_code)}</TableCell>
                <TableCell>{tCommon("months", { count: q.months })}</TableCell>
                <TableCell>{formatRupiah(q.monthly, locale as Locale)}</TableCell>
                <TableCell>{new Date(q.created_at).toLocaleDateString(locale)}</TableCell>
              </TableRow>
            ))}
            {quotes.length === 0 && (
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
