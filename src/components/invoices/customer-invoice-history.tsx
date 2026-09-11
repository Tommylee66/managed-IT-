"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Locale } from "@/config/constants";
import { formatRupiah } from "@/lib/utils/currency";

interface CustomerOption {
  code: string;
  name: string;
}

interface InvoiceHistoryRow {
  no: string;
  contractNo: string | null;
  month: string;
  date: string;
  dueDate: string | null;
  total: number;
  paidAmount: number | null;
  sentAt: string | null;
}

export function CustomerInvoiceHistory({
  customers,
  customerCode,
  invoices,
  month,
  date,
  dueDate,
}: {
  customers: CustomerOption[];
  customerCode: string;
  invoices: InvoiceHistoryRow[];
  month: string;
  date: string;
  dueDate: string;
}) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;

  function selectCustomer(code: string) {
    const query = new URLSearchParams({ month, date, dueDate, customer: code });
    router.push(`/${locale}/invoices?${query.toString()}`);
  }

  const billedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidTotal = invoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? 0), 0);
  const balance = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.total - (invoice.paidAmount ?? 0)),
    0
  );
  const selectedCustomer = customers.find((customer) => customer.code === customerCode);
  const exportUrl = `/api/invoices/export?customerCode=${encodeURIComponent(customerCode)}&locale=${locale}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customerHistoryTitle")}</CardTitle>
        <CardDescription>{t("customerHistoryDescription")}</CardDescription>
        <CardAction>
          {customerCode ? (
            <Button asChild>
              <a href={exportUrl}>{t("downloadExcel")}</a>
            </Button>
          ) : (
            <Button disabled>{t("downloadExcel")}</Button>
          )}
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="max-w-md space-y-2">
          <Label>{t("customer")}</Label>
          <Select value={customerCode || undefined} onValueChange={selectCustomer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectCustomer")} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.code} value={customer.code}>
                  {customer.code} · {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {selectedCustomer && (
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
              <p className="text-xs text-muted-foreground">{t("invoiceCount")}</p>
              <p className="text-lg font-semibold">{t("countUnit", { count: invoices.length })}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
              <p className="text-xs text-muted-foreground">{t("billedTotal")}</p>
              <p className="text-lg font-semibold">{formatRupiah(billedTotal, locale)}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
              <p className="text-xs text-muted-foreground">{t("paidTotal")}</p>
              <p className="text-lg font-semibold">{formatRupiah(paidTotal, locale)}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
              <p className="text-xs text-muted-foreground">{t("outstandingAmount")}</p>
              <p className="text-lg font-semibold">{formatRupiah(balance, locale)}</p>
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        {!customerCode ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("chooseCustomerFirst")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNo")}</TableHead>
                <TableHead>{t("billingMonth")}</TableHead>
                <TableHead>{t("contractNo")}</TableHead>
                <TableHead>{t("issueDate")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
                <TableHead className="text-right">{t("paidAmount")}</TableHead>
                <TableHead>{t("paymentStatus")}</TableHead>
                <TableHead className="text-right">{t("content")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const paid = invoice.paidAmount ?? 0;
                const paymentLabel =
                  paid <= 0
                    ? t("unpaidBadge")
                    : paid >= invoice.total
                      ? t("paidBadge")
                      : t("partiallyPaidBadge");
                return (
                  <TableRow key={invoice.no}>
                    <TableCell className="font-medium">{invoice.no}</TableCell>
                    <TableCell>{invoice.month}</TableCell>
                    <TableCell>{invoice.contractNo ?? "-"}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="text-right">{formatRupiah(invoice.total, locale)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(paid, locale)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={paid >= invoice.total ? "default" : "secondary"}>{paymentLabel}</Badge>
                        <Badge variant={invoice.sentAt ? "outline" : "secondary"}>
                          {invoice.sentAt ? t("statusSent") : t("statusUnsent")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/invoices/${invoice.no}`}>{t("viewContent")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {t("noCustomerInvoices")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
