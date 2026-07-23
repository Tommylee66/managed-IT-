"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryBox } from "@/components/ui/summary-box";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import { renderQuoteRowLabel } from "@/lib/calc/quote-row-labels";
import type { Locale } from "@/config/constants";
import { calculateQuotePreviewAction, type QuotePreview } from "@/app/[locale]/(dashboard)/quotes/actions";
import { createApplicationAction } from "@/app/[locale]/(dashboard)/applications/actions";
import type { Customer, Agent, QuoteInputs } from "@/types/domain";

const SOURCE_OPTIONS = [
  { value: "신규 직접입력", key: "sourceNewDirect" },
  { value: "고객 소개", key: "sourceReferral" },
  { value: "영업사원 접수", key: "sourceAgentIntake" },
  { value: "기존 고객 추가신청", key: "sourceExistingCustomerAddon" },
] as const;

interface FormValues {
  source: string;
  customer_code: string;
  new_customer_name: string;
  new_customer_phone: string;
  new_customer_email: string;
  new_customer_tax_id: string;
  agent_code: string;
  start_date: string;
  billing_date: string;
  months: number;
  emp: number;
  cctv: number;
  locationIndex: number;
  discount: number;
  memo: string;
}

const today = new Date().toISOString().slice(0, 10);

export function ApplicationForm({
  customers,
  agents,
  locationNames,
}: {
  customers: Customer[];
  agents: Agent[];
  locationNames: string[];
}) {
  const t = useTranslations("applications");
  const tCalc = useTranslations("serviceCalculator");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [isCalculating, startCalculating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      source: SOURCE_OPTIONS[0].value,
      start_date: today,
      billing_date: today,
      months: 36,
      emp: 20,
      cctv: 4,
      locationIndex: 0,
      discount: 0,
      memo: "",
    },
  });

  function toInputs(v: FormValues): QuoteInputs {
    return {
      emp: Number(v.emp),
      // Application intake doesn't select specific equipment or additional
      // services yet — that happens when the quote itself is built (see
      // quote-calculator-form.tsx). AP/Hub/visit/VPN/security/priority no
      // longer price as generic add-ons either way, so these stay at
      // baseline. CCTV is a real input (base includes 4 units, extra billed
      // per unit), same as employee count.
      ap: 1,
      hub: 1,
      cctv: Number(v.cctv),
      visit: 1,
      locationIndex: Number(v.locationIndex),
      vpn: "none",
      vpnBranches: 0,
      security: "none",
      priority: "no",
      discount: Number(v.discount),
      memo: v.memo,
    };
  }

  function recalculate() {
    const v = getValues();
    startCalculating(async () => {
      try {
        const result = await calculateQuotePreviewAction(toInputs(v), Number(v.months));
        setPreview(result);
      } catch {
        toast.error(t("calculateError"));
      }
    });
  }

  async function onSave(v: FormValues) {
    if (!isNewCustomer && !v.customer_code) {
      toast.error(t("selectCustomerError"));
      return;
    }
    if (isNewCustomer && !v.new_customer_name) {
      toast.error(t("newCustomerNameError"));
      return;
    }
    setIsSaving(true);
    try {
      const application = await createApplicationAction({
        source: v.source,
        customer_code: isNewCustomer ? undefined : v.customer_code,
        new_customer_name: isNewCustomer ? v.new_customer_name : undefined,
        new_customer_phone: isNewCustomer ? v.new_customer_phone : undefined,
        new_customer_email: isNewCustomer ? v.new_customer_email : undefined,
        new_customer_tax_id: isNewCustomer ? v.new_customer_tax_id : undefined,
        agent_code: v.agent_code || undefined,
        start_date: v.start_date,
        billing_date: v.billing_date,
        months: Number(v.months),
        inputs: toInputs(v),
        memo: v.memo,
      });
      toast.success(t("saveSuccess"));
      router.push(`/${locale}/applications/${application.no}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("formTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button type="button" variant={isNewCustomer ? "default" : "outline"} size="sm" onClick={() => setIsNewCustomer(true)}>
              {t("newCustomerTab")}
            </Button>
            <Button type="button" variant={!isNewCustomer ? "default" : "outline"} size="sm" onClick={() => setIsNewCustomer(false)}>
              {t("existingCustomerTab")}
            </Button>
          </div>

          {isNewCustomer ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="new_customer_name">{t("newCustomerName")}</Label>
                <Input id="new_customer_name" {...register("new_customer_name")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new_customer_phone">{t("newCustomerPhone")}</Label>
                <Input id="new_customer_phone" {...register("new_customer_phone")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new_customer_email">{t("newCustomerEmail")}</Label>
                <Input id="new_customer_email" type="email" {...register("new_customer_email")} />
              </div>
              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="new_customer_tax_id">{t("newCustomerTaxId")}</Label>
                <Input id="new_customer_tax_id" {...register("new_customer_tax_id")} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>{t("existingCustomerSelect")}</Label>
              <Select onValueChange={(v) => setValue("customer_code", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={tCalc("select")} />
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>{t("applicationSource")}</Label>
              <Select defaultValue={SOURCE_OPTIONS[0].value} onValueChange={(v) => setValue("source", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {t(s.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{tCalc("salesAgent")}</Label>
              <Select onValueChange={(v) => setValue("agent_code", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={tCalc("noAgentSelected")} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">{t("expectedStartDate")}</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="months">{tCalc("contractMonths")}</Label>
              <Input id="months" type="number" {...register("months")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp">{tCalc("employeeCount")}</Label>
              <Input id="emp" type="number" {...register("emp")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cctv">{tCalc("cctvCount")}</Label>
              <Input id="cctv" type="number" {...register("cctv")} />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label>{tCalc("location")}</Label>
              <Select defaultValue="0" onValueChange={(v) => setValue("locationIndex", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationNames.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("memo")}</Label>
            <Textarea id="memo" {...register("memo")} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={recalculate} disabled={isCalculating}>
              {isCalculating ? tCalc("calculating") : tCalc("calculate")}
            </Button>
            <Button type="button" onClick={handleSubmit(onSave)} disabled={isSaving || !preview}>
              {isSaving ? t("saving") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("expectedQuoteCalc")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <p className="text-muted-foreground">{t("resultPlaceholder")}</p>
          ) : (
            <SummaryBox
              label={t("monthlyTotal")}
              value={formatRupiah(preview.total, locale as Locale)}
              metrics={[
                { label: tCalc("monthlySubtotal"), value: formatRupiah(preview.monthly, locale as Locale) },
                { label: tCalc("ppn"), value: formatRupiah(preview.ppn, locale as Locale) },
              ]}
            />
          )}
        </CardContent>
        {preview && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCalc("item")}</TableHead>
                  <TableHead className="text-right">{tCalc("monthlyAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{renderQuoteRowLabel(r, locale as Locale)}</TableCell>
                    <TableCell className="text-right">{formatRupiah(r.amount, locale as Locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
