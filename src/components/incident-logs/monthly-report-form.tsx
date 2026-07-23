"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  loadReportRecordsAction,
  generateReportDraftAction,
  sendReportEmailAction,
  type ReportRecordsResult,
} from "@/app/[locale]/(dashboard)/incident-logs/report/actions";
import type { Customer } from "@/types/domain";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyReportForm({ customers }: { customers: Customer[] }) {
  const t = useTranslations("incidentLogs");
  const [customerCode, setCustomerCode] = useState("");
  const [month, setMonth] = useState(currentMonthKey());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [records, setRecords] = useState<ReportRecordsResult | null>(null);
  const [draft, setDraft] = useState("");
  const [draftSource, setDraftSource] = useState<string | null>(null);
  const [subject, setSubject] = useState("");

  async function handleLoad() {
    if (!customerCode) {
      toast.error(t("selectCustomerError"));
      return;
    }
    setIsLoading(true);
    try {
      const result = await loadReportRecordsAction(customerCode, month);
      setRecords(result);
      setDraft("");
      setDraftSource(null);
      setSubject(`${result.customerName} - ${month} ${t("monthlyReportTitle")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!customerCode) {
      toast.error(t("selectCustomerError"));
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateReportDraftAction(customerCode, month);
      setDraft(result.draft);
      setDraftSource(result.source);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!draft.trim()) {
      toast.error(t("draftRequiredError"));
      return;
    }
    if (!window.confirm(t("sendConfirm"))) return;
    setIsSending(true);
    try {
      const result = await sendReportEmailAction(customerCode, month, subject, draft);
      toast.success(t("sendSuccess", { email: result.sentTo }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("selectCustomerMonth")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("customer")}</Label>
            <Select onValueChange={setCustomerCode}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("month")}</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>
          <Button type="button" variant="outline" onClick={handleLoad} disabled={isLoading}>
            {isLoading ? t("loading") : t("loadRecords")}
          </Button>
        </CardContent>
      </Card>

      {records && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("recordsFound", { count: records.records.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("occurredDate")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("logTitle")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.occurred_date}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === "incident" ? "destructive" : "secondary"}>
                        {r.type === "incident" ? t("typeIncident") : t("typeInspection")}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell className="max-w-md truncate">{r.description}</TableCell>
                  </TableRow>
                ))}
                {records.records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t("empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {records && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("draftTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={handleGenerate} disabled={isGenerating} className="w-fit">
              {isGenerating ? t("generating") : t("generateDraft")}
            </Button>
            {draftSource && (
              <p className="text-xs text-muted-foreground">
                {draftSource === "template" ? t("draftSourceTemplate") : t("draftSourceAi", { source: draftSource })}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">{t("emailSubject")}</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="draft">{t("emailBody")}</Label>
              <Textarea
                id="draft"
                rows={14}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("draftPlaceholder")}
              />
            </div>
            <Button type="button" onClick={handleSend} disabled={isSending} className="w-fit">
              {isSending ? t("sending") : t("sendEmail")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
