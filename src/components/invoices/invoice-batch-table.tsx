"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { saveInvoicesAction, markInvoicesSentAction } from "@/app/[locale]/(dashboard)/invoices/actions";
import type { Contract, Customer, Invoice } from "@/types/domain";
import type { Locale } from "@/config/constants";

export interface BillableRowView {
  contract: Contract;
  customer: Customer;
  totals: { subtotal: number; ppn: number; total: number };
  invoice: Invoice | null;
  recipientEmail: string;
}

export function InvoiceBatchTable({
  rows,
  month,
  date,
  dueDate,
}: {
  rows: BillableRowView[];
  month: string;
  date: string;
  dueDate: string;
}) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function rowStatus(row: BillableRowView): { label: string; variant: "default" | "secondary" | "destructive" } {
    if (!row.recipientEmail) return { label: t("statusNoEmail"), variant: "destructive" };
    if (row.invoice?.sent_at) return { label: t("statusSent"), variant: "default" };
    if (row.invoice) return { label: t("statusSaved"), variant: "secondary" };
    return { label: t("statusUnsent"), variant: "secondary" };
  }

  function toggle(no: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  }

  function updateQuery(next: Partial<{ month: string; date: string; dueDate: string }>) {
    const query = new URLSearchParams({ month, date, dueDate, ...next });
    router.push(`/${locale}/invoices?${query.toString()}`);
  }

  function runAction(action: (nos: string[], m: string, d: string, due: string) => Promise<unknown>, label: string) {
    const nos = [...selected];
    if (!nos.length) {
      toast.error(t("selectInvoiceError"));
      return;
    }
    startTransition(async () => {
      try {
        await action(nos, month, date, dueDate);
        toast.success(t("processSuccess", { count: nos.length, action: label }));
        setSelected(new Set());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("processError"));
      }
    });
  }

  const total = rows.reduce((s, r) => s + r.totals.total, 0);
  const sentCount = rows.filter((r) => r.invoice?.sent_at).length;
  const noEmailCount = rows.filter((r) => !r.recipientEmail).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>{t("billingMonth")}</Label>
            <Input type="month" value={month} onChange={(e) => updateQuery({ month: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("issueDate")}</Label>
            <Input type="date" value={date} onChange={(e) => updateQuery({ date: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("dueDate")}</Label>
            <Input type="date" value={dueDate} onChange={(e) => updateQuery({ dueDate: e.target.value })} />
          </div>
        </div>
      </CardContent>

      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
            <p className="text-xs text-muted-foreground">{t("billableTarget")}</p>
            <p className="text-lg font-semibold">{t("countUnit", { count: rows.length })}</p>
          </div>
          <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
            <p className="text-xs text-muted-foreground">{t("totalAmount")}</p>
            <p className="text-lg font-semibold">{formatRupiah(total, locale as Locale)}</p>
          </div>
          <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
            <p className="text-xs text-muted-foreground">{t("sentCount")}</p>
            <p className="text-lg font-semibold">{t("countUnit", { count: sentCount })}</p>
          </div>
          <div className="rounded-xl border border-border bg-[#fbfdff] p-3">
            <p className="text-xs text-muted-foreground">{t("noEmailCount")}</p>
            <p className="text-lg font-semibold">{t("countUnit", { count: noEmailCount })}</p>
          </div>
        </div>
      </CardContent>

      <CardContent>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => runAction(saveInvoicesAction, t("processedSaved"))}
          >
            {t("saveSelected")}
          </Button>
          <Button disabled={isPending} onClick={() => runAction(markInvoicesSentAction, t("processedSent"))}>
            {t("markSent")}
          </Button>
        </div>
      </CardContent>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("contractNo")}</TableHead>
              <TableHead>{t("invoiceEmail")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = rowStatus(row);
              return (
                <TableRow key={row.contract.no}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.contract.no)}
                      disabled={!row.recipientEmail}
                      onCheckedChange={() => toggle(row.contract.no)}
                    />
                  </TableCell>
                  <TableCell>{row.customer.name}</TableCell>
                  <TableCell>{row.contract.no}</TableCell>
                  <TableCell>{row.recipientEmail || t("notRegisteredEmail")}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row.totals.total, locale as Locale)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("noTarget")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
