"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  loadMeterTargetsAction,
  saveMeterReadingsAction,
  type MeterTargetsResult,
} from "@/app/[locale]/(dashboard)/incident-logs/meter/actions";
import type { Customer } from "@/types/domain";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

interface Draft {
  mono: string;
  color: string;
}

const rowKey = (contractNo: string, catalogId: string) => `${contractNo}:${catalogId}`;

export function MeterReadingForm({ customers }: { customers: Customer[] }) {
  const t = useTranslations("meterReadings");
  const tIncident = useTranslations("incidentLogs");
  const [customerCode, setCustomerCode] = useState("");
  const [month, setMonth] = useState(currentMonthKey());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<MeterTargetsResult | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [readingDate, setReadingDate] = useState(todayKey());
  const [engineer, setEngineer] = useState("");

  async function handleLoad() {
    if (!customerCode) {
      toast.error(tIncident("selectCustomerError"));
      return;
    }
    setIsLoading(true);
    try {
      const loaded = await loadMeterTargetsAction(customerCode, month);
      setResult(loaded);
      // Blank rather than 0 where nothing has been read: an empty box says
      // "not read", a 0 says "read, printed nothing" — and only the first
      // falls back to the quoted estimate at invoicing time.
      setDrafts(
        Object.fromEntries(
          loaded.targets.map((x) => [
            rowKey(x.contractNo, x.catalogId),
            {
              mono: x.monoQty == null ? "" : String(x.monoQty),
              color: x.colorQty == null ? "" : String(x.colorQty),
            },
          ])
        )
      );
      const existing = loaded.targets.find((x) => x.readingDate || x.engineer);
      if (existing?.readingDate) setReadingDate(existing.readingDate);
      if (existing?.engineer) setEngineer(existing.engineer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    try {
      const byContract = new Map<
        string,
        { catalog_id: string; mono_qty: number; color_qty: number; reading_date: string; engineer: string }[]
      >();
      for (const x of result.targets) {
        const d = drafts[rowKey(x.contractNo, x.catalogId)] ?? { mono: "", color: "" };
        const entries = byContract.get(x.contractNo) ?? [];
        entries.push({
          catalog_id: x.catalogId,
          mono_qty: Number(d.mono || 0),
          color_qty: Number(d.color || 0),
          reading_date: readingDate,
          engineer,
        });
        byContract.set(x.contractNo, entries);
      }
      await saveMeterReadingsAction({
        customerCode,
        month,
        byContract: [...byContract].map(([contractNo, entries]) => ({ contractNo, entries })),
      });
      toast.success(t("saveSuccess"));
      await handleLoad();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  function setDraft(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { mono: "", color: "" }), ...patch } }));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tIncident("selectCustomerMonth")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>{tIncident("customer")}</Label>
            <Select onValueChange={setCustomerCode}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={tIncident("select")} />
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
            <Label>{tIncident("month")}</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button type="button" variant="outline" onClick={handleLoad} disabled={isLoading}>
            {isLoading ? tIncident("loading") : t("loadTargets")}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {result.customerName} · {result.month}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label>{t("readingDate")}</Label>
                <Input
                  type="date"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("engineer")}</Label>
                <Input
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  className="w-52"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("model")}</TableHead>
                  <TableHead>{t("contract")}</TableHead>
                  <TableHead className="text-right">{t("includedMono")}</TableHead>
                  <TableHead className="text-right">{t("monoQty")}</TableHead>
                  <TableHead className="text-right">{t("includedColor")}</TableHead>
                  <TableHead className="text-right">{t("colorQty")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.targets.map((x) => {
                  const key = rowKey(x.contractNo, x.catalogId);
                  const d = drafts[key] ?? { mono: "", color: "" };
                  const recorded = x.monoQty != null || x.colorQty != null;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        {x.modelName}
                        {x.qty > 1 && <span className="text-muted-foreground"> x {x.qty}</span>}
                        {x.spec && (
                          <span className="block text-xs text-muted-foreground">{x.spec}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{x.contractNo}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {x.includedMono > 0 ? x.includedMono.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-28"
                          placeholder={t("notRead")}
                          value={d.mono}
                          onChange={(e) => setDraft(key, { mono: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {x.colorTiered && x.includedColor > 0 ? x.includedColor.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {x.colorTiered ? (
                          <Input
                            type="number"
                            min={0}
                            className="w-28"
                            placeholder={t("notRead")}
                            value={d.color}
                            onChange={(e) => setDraft(key, { color: e.target.value })}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={recorded ? "default" : "secondary"}>
                          {recorded ? t("recorded") : t("notRead")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {result.targets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t("noTargets")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {result.targets.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">{t("hint")}</p>
                <Button type="button" onClick={handleSave} disabled={isSaving} className="w-fit">
                  {isSaving ? t("saving") : t("save")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
