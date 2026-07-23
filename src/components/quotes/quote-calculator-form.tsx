"use client";

import { useEffect, useState, useTransition } from "react";
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
import {
  EquipmentSelector,
  equipmentQtyToRequest,
  type EquipmentSelectionState,
} from "@/components/quotes/equipment-selector";
import {
  ServiceSelector,
  serviceQtyToRequest,
  type ServiceSelectionState,
} from "@/components/quotes/service-selector";
import type { Locale } from "@/config/constants";
import {
  calculateQuotePreviewAction,
  createQuoteAction,
  updateQuoteAction,
  type QuotePreview,
} from "@/app/[locale]/(dashboard)/quotes/actions";
import type {
  Customer,
  Agent,
  QuoteInputs,
  EquipmentCatalogItem,
  EquipmentSelection,
  ServiceCatalogItem,
  ServiceSelection,
} from "@/types/domain";

export interface QuoteEditInitialValues {
  no: string;
  customer_code: string;
  agent_code: string | null;
  start_date: string;
  billing_date: string;
  months: number;
  inputs: QuoteInputs;
  equipment_selections: EquipmentSelection[];
  service_selections: ServiceSelection[];
}

interface FormValues {
  customer_code: string;
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

export function QuoteCalculatorForm({
  customers,
  agents,
  locationNames,
  equipmentCatalog,
  serviceCatalog,
  initialValues,
}: {
  customers: Customer[];
  agents: Agent[];
  locationNames: string[];
  equipmentCatalog: EquipmentCatalogItem[];
  serviceCatalog: ServiceCatalogItem[];
  initialValues?: QuoteEditInitialValues;
}) {
  const t = useTranslations("serviceCalculator");
  const tQuotes = useTranslations("quotes");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [isCalculating, startCalculating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [equipmentQty, setEquipmentQty] = useState<Record<string, EquipmentSelectionState>>(() => {
    const initial: Record<string, EquipmentSelectionState> = {};
    initialValues?.equipment_selections.forEach((s) => {
      initial[s.catalogId] = { qty: s.qty, overageQty: s.overageQty };
    });
    return initial;
  });
  const [serviceQty, setServiceQty] = useState<Record<string, ServiceSelectionState>>(() => {
    const initial: Record<string, ServiceSelectionState> = {};
    initialValues?.service_selections.forEach((s) => {
      initial[s.catalogId] = { qty: s.qty };
    });
    return initial;
  });

  const { register, handleSubmit, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      customer_code: initialValues?.customer_code ?? "",
      agent_code: initialValues?.agent_code ?? "",
      start_date: initialValues?.start_date ?? today,
      billing_date: initialValues?.billing_date ?? today,
      months: initialValues?.months ?? 36,
      emp: initialValues?.inputs.emp ?? 20,
      cctv: initialValues?.inputs.cctv ?? 4,
      locationIndex: initialValues?.inputs.locationIndex ?? 0,
      discount: initialValues?.inputs.discount ?? 0,
      memo: initialValues?.inputs.memo ?? "",
    },
  });

  function toInputs(v: FormValues): QuoteInputs {
    return {
      emp: Number(v.emp),
      // AP/Hub no longer price as generic per-unit add-ons (equipment
      // catalog selections instead), and visit frequency/VPN/security/
      // priority-response no longer price as hardcoded rate fields (service
      // catalog selections instead, see ServiceSelector below). These stay
      // at their baseline (no-extra-charge) values only because QuoteInputs
      // still carries the fields for old stored quotes. CCTV, however, is a
      // real input again — base service includes 4 units, extra billed per
      // unit (see quote-calc.ts).
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
        const result = await calculateQuotePreviewAction(
          toInputs(v),
          Number(v.months),
          equipmentQtyToRequest(equipmentQty),
          serviceQtyToRequest(serviceQty)
        );
        setPreview(result);
      } catch {
        toast.error(t("calculateError"));
      }
    });
  }

  // Editing an existing quote: show its current numbers immediately instead
  // of forcing an extra "계산하기" click before Save becomes usable.
  useEffect(() => {
    if (initialValues) recalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(v: FormValues) {
    if (!v.customer_code) {
      toast.error(t("selectCustomerError"));
      return;
    }
    setIsSaving(true);
    try {
      if (initialValues) {
        await updateQuoteAction(initialValues.no, {
          customer_code: v.customer_code,
          agent_code: v.agent_code || undefined,
          start_date: v.start_date,
          billing_date: v.billing_date,
          months: Number(v.months),
          inputs: toInputs(v),
          equipment_selections: equipmentQtyToRequest(equipmentQty),
          service_selections: serviceQtyToRequest(serviceQty),
        });
        toast.success(tQuotes("updateSuccess"));
        router.push(`/${locale}/quotes/${initialValues.no}`);
      } else {
        const quote = await createQuoteAction({
          customer_code: v.customer_code,
          agent_code: v.agent_code || undefined,
          start_date: v.start_date,
          billing_date: v.billing_date,
          months: Number(v.months),
          inputs: toInputs(v),
          equipment_selections: equipmentQtyToRequest(equipmentQty),
          service_selections: serviceQtyToRequest(serviceQty),
        });
        toast.success(t("saveSuccess"));
        router.push(`/${locale}/quotes/${quote.no}`);
      }
    } catch {
      toast.error(initialValues ? tQuotes("updateError") : t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tQuotes("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 col-span-2">
              <Label>{t("customer")}</Label>
              <Select
                defaultValue={initialValues?.customer_code}
                onValueChange={(v) => setValue("customer_code", v)}
              >
                <SelectTrigger>
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
            <div className="flex flex-col gap-2 col-span-2">
              <Label>{t("salesAgent")}</Label>
              <Select
                defaultValue={initialValues?.agent_code ?? undefined}
                onValueChange={(v) => setValue("agent_code", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("noAgentSelected")} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code} - {a.name} ({a.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">{t("serviceStartDate")}</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing_date">{t("billingStartDate")}</Label>
              <Input id="billing_date" type="date" {...register("billing_date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="months">{t("contractMonths")}</Label>
              <Input id="months" type="number" {...register("months")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp">{t("employeeCount")}</Label>
              <Input id="emp" type="number" {...register("emp")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cctv">{t("cctvCount")}</Label>
              <Input id="cctv" type="number" {...register("cctv")} />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label>{t("location")}</Label>
              <Select
                defaultValue={String(initialValues?.inputs.locationIndex ?? 0)}
                onValueChange={(v) => setValue("locationIndex", Number(v))}
              >
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="discount">{t("discount")}</Label>
              <Input id="discount" type="number" {...register("discount")} />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
            <Label className="text-sm font-semibold">{tQuotes("baseServiceTitle")}</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {tQuotes("baseServiceDescription")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">{tQuotes("serviceSelectTitle")}</Label>
            {serviceCatalog.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tQuotes("serviceSelectEmpty")}</p>
            ) : (
              <ServiceSelector catalog={serviceCatalog} value={serviceQty} onChange={setServiceQty} locale={locale as Locale} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">{tQuotes("equipmentSelectTitle")}</Label>
            {equipmentCatalog.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tQuotes("equipmentSelectEmpty")}</p>
            ) : (
              <EquipmentSelector catalog={equipmentCatalog} value={equipmentQty} onChange={setEquipmentQty} locale={locale as Locale} />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("memo")}</Label>
            <Textarea id="memo" {...register("memo")} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={recalculate} disabled={isCalculating}>
              {isCalculating ? t("calculating") : t("calculate")}
            </Button>
            <Button type="button" onClick={handleSubmit(onSave)} disabled={isSaving || !preview}>
              {isSaving
                ? t("saving")
                : initialValues
                  ? tQuotes("saveChanges")
                  : t("saveQuote")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("resultTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <p className="text-muted-foreground">{t("resultPlaceholder")}</p>
          ) : (
            <SummaryBox
              label={t("monthlyTotal")}
              value={formatRupiah(preview.total, locale as Locale)}
              metrics={
                preview.margin !== undefined
                  ? [
                      { label: t("monthlyCost"), value: formatRupiah(preview.monthlyCost ?? 0, locale as Locale) },
                      { label: t("totalCostWithInit"), value: formatRupiah(preview.totalCost ?? 0, locale as Locale) },
                      { label: t("marginRate"), value: `${preview.margin.toFixed(1)}%` },
                      { label: t("ppn"), value: formatRupiah(preview.ppn, locale as Locale) },
                    ]
                  : [
                      { label: t("marginRateBucketed"), value: preview.marginBucket ?? "-" },
                      { label: t("ppn"), value: formatRupiah(preview.ppn, locale as Locale) },
                    ]
              }
            />
          )}
        </CardContent>
        {preview && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("item")}</TableHead>
                  <TableHead className="text-right">{t("monthlyAmount")}</TableHead>
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
