"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { formatRupiah } from "@/lib/utils/currency";
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
import { calcProratedSettlement } from "@/lib/calc/proration";
import { calculateQuotePreviewAction, type QuotePreview } from "@/app/[locale]/(dashboard)/quotes/actions";
import { createChangeRequestAction } from "@/app/[locale]/(dashboard)/change-requests/actions";
import type { Contract, EquipmentCatalogItem, ServiceCatalogItem, QuoteInputs } from "@/types/domain";
import type { Locale } from "@/config/constants";

const TYPE_OPTIONS = [
  { value: "장비 추가", key: "typeEquipmentAdd" },
  { value: "장비 삭제", key: "typeEquipmentRemove" },
  { value: "서비스 변경", key: "typeServiceChange" },
  { value: "요금 변경", key: "typeFeeChange" },
  { value: "로케이션 변경", key: "typeLocationChange" },
  { value: "기타", key: "typeOther" },
] as const;

interface FormValues {
  type: string;
  effective_date: string;
  emp: number;
  cctv: number;
  locationIndex: number;
  discount: number;
  memo: string;
}

export function ChangeRequestForm({
  contract,
  locationNames,
  equipmentCatalog,
  serviceCatalog,
}: {
  contract: Contract;
  locationNames: string[];
  equipmentCatalog: EquipmentCatalogItem[];
  serviceCatalog: ServiceCatalogItem[];
}) {
  const t = useTranslations("changeRequests");
  const tCalc = useTranslations("serviceCalculator");
  const tQuotes = useTranslations("quotes");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const currentInputs = contract.quote_snapshot?.inputs as QuoteInputs | undefined;
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [isCalculating, startCalculating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [equipmentQty, setEquipmentQty] = useState<Record<string, EquipmentSelectionState>>(() => {
    const initial: Record<string, EquipmentSelectionState> = {};
    (contract.quote_snapshot?.equipment_selections ?? []).forEach((s) => {
      initial[s.catalogId] = { qty: s.qty, overageQty: s.overageQty };
    });
    return initial;
  });
  const [serviceQty, setServiceQty] = useState<Record<string, ServiceSelectionState>>(() => {
    const initial: Record<string, ServiceSelectionState> = {};
    (contract.quote_snapshot?.service_selections ?? []).forEach((s) => {
      initial[s.catalogId] = { qty: s.qty };
    });
    return initial;
  });

  const { register, control, handleSubmit, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      type: TYPE_OPTIONS[2].value,
      effective_date: new Date().toISOString().slice(0, 10),
      emp: currentInputs?.emp ?? 20,
      cctv: currentInputs?.cctv ?? 4,
      locationIndex: currentInputs?.locationIndex ?? 0,
      discount: currentInputs?.discount ?? 0,
      memo: "",
    },
  });

  function toInputs(v: FormValues): QuoteInputs {
    return {
      emp: Number(v.emp),
      // See quote-calculator-form.tsx — AP/Hub price only via equipment
      // catalog selections, and visit/vpn/security/priority only via service
      // catalog selections, below. CCTV is a real input (base includes 4
      // units, extra billed per unit).
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
          contract.months,
          equipmentQtyToRequest(equipmentQty),
          serviceQtyToRequest(serviceQty)
        );
        setPreview(result);
      } catch {
        toast.error(t("calculateError"));
      }
    });
  }

  async function onSave(v: FormValues) {
    setIsSaving(true);
    try {
      await createChangeRequestAction(contract.no, {
        type: v.type,
        effective_date: v.effective_date,
        new_inputs: toInputs(v),
        new_equipment_selections: equipmentQtyToRequest(equipmentQty),
        new_service_selections: serviceQtyToRequest(serviceQty),
        memo: v.memo,
      });
      toast.success(t("saveSuccess"));
      router.push(`/${locale}/contracts/${contract.no}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  const diff = preview ? preview.monthly - contract.monthly_fee : null;
  const effectiveDate = getValues("effective_date");
  const settlement = preview && diff !== null ? calcProratedSettlement(effectiveDate, diff) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("changeContent")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>{t("changeType")}</Label>
              <Select defaultValue={TYPE_OPTIONS[2].value} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(o.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="effective_date">{t("effectiveDate")}</Label>
              <Input id="effective_date" type="date" {...register("effective_date")} />
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
              <Select
                defaultValue={String(currentInputs?.locationIndex ?? 0)}
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
              <Label htmlFor="discount">{tCalc("discount")}</Label>
              <Controller
                control={control}
                name="discount"
                render={({ field }) => (
                  <CurrencyInput
                    id="discount"
                    locale={locale as Locale}
                    value={String(field.value ?? "")}
                    onChange={(digits) => field.onChange(digits ? Number(digits) : 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
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
            <Label htmlFor="memo">{tCalc("memo")}</Label>
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
          <CardTitle className="text-base">{t("resultTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {preview ? (
            <SummaryBox
              label={t("afterMonthly")}
              value={formatRupiah(preview.monthly, locale as Locale)}
              metrics={[
                { label: t("currentMonthly"), value: formatRupiah(contract.monthly_fee, locale as Locale) },
                { label: t("monthlyDiff"), value: formatRupiah(diff ?? 0, locale as Locale) },
                { label: t("settlementAmount"), value: formatRupiah(settlement ?? 0, locale as Locale) },
              ]}
            />
          ) : null}
          {preview && <p className="mt-2 text-xs text-muted-foreground">{t("settlementHint")}</p>}
          {!preview && (
            <p className="text-muted-foreground">{t("resultPlaceholder")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
