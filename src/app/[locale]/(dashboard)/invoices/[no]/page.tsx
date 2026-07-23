import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getInvoice } from "@/lib/data-access/invoices";
import { formatRupiah } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InvoiceLineItem } from "@/lib/calc/invoice-calc";
import type { Locale } from "@/config/constants";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const invoice = await getInvoice(supabase, no, session!.role);
  if (!invoice) notFound();

  const [t, tContracts] = await Promise.all([
    getTranslations("invoices"),
    getTranslations("contracts"),
  ]);

  const items = invoice.items as unknown as InvoiceLineItem[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {t("detailTitle")} {invoice.no}
          </h1>
          <Badge variant={invoice.sent_at ? "default" : "secondary"}>
            {invoice.sent_at ? t("sentBadge") : t("unsentBadge")}
          </Badge>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/invoices/${invoice.no}/print`}>{t("printView")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("customer")}</p>
            <p>{invoice.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{tContracts("contractNo")}</p>
            <p>{invoice.contract_no}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("month")}</p>
            <p>{invoice.month}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("invoiceEmail")}</p>
            <p>{invoice.recipient_email || t("notRegisteredEmail")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("issueDate")}</p>
            <p>{invoice.date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("dueDate")}</p>
            <p>{invoice.due_date}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("billingDetail")}</CardTitle>
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
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="text-right">{formatRupiah(item.amount, locale as Locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatRupiah(invoice.subtotal, locale as Locale)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("ppn")}</span>
              <span>{formatRupiah(invoice.ppn, locale as Locale)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>{formatRupiah(invoice.total, locale as Locale)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{invoice.memo}</p>
        </CardContent>
      </Card>
    </div>
  );
}
