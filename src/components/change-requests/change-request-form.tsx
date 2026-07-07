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
import { formatRupiah } from "@/lib/utils/currency";
import { calculateQuotePreviewAction, type QuotePreview } from "@/app/[locale]/(dashboard)/quotes/actions";
import { createChangeRequestAction } from "@/app/[locale]/(dashboard)/change-requests/actions";
import type { Contract, QuoteInputs } from "@/types/domain";

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
  ap: number;
  hub: number;
  cctv: number;
  visit: 1 | 2;
  locationIndex: number;
  vpn: "none" | "base";
  vpnBranches: number;
  security: "none" | "monitor" | "device";
  priority: "no" | "yes";
  discount: number;
  memo: string;
}

export function ChangeRequestForm({
  contract,
  locationNames,
}: {
  contract: Contract;
  locationNames: string[];
}) {
  const t = useTranslations("changeRequests");
  const tCalc = useTranslations("serviceCalculator");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const currentInputs = contract.quote_snapshot?.inputs as QuoteInputs | undefined;
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [isCalculating, startCalculating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      type: TYPE_OPTIONS[2].value,
      effective_date: new Date().toISOString().slice(0, 10),
      emp: currentInputs?.emp ?? 20,
      ap: currentInputs?.ap ?? 1,
      hub: currentInputs?.hub ?? 1,
      cctv: currentInputs?.cctv ?? 8,
      visit: currentInputs?.visit ?? 1,
      locationIndex: currentInputs?.locationIndex ?? 0,
      vpn: currentInputs?.vpn ?? "none",
      vpnBranches: currentInputs?.vpnBranches ?? 0,
      security: currentInputs?.security ?? "none",
      priority: currentInputs?.priority ?? "no",
      discount: currentInputs?.discount ?? 0,
      memo: "",
    },
  });

  function toInputs(v: FormValues): QuoteInputs {
    return {
      emp: Number(v.emp),
      ap: Number(v.ap),
      hub: Number(v.hub),
      cctv: Number(v.cctv),
      visit: Number(v.visit) === 2 ? 2 : 1,
      locationIndex: Number(v.locationIndex),
      vpn: v.vpn,
      vpnBranches: Number(v.vpnBranches),
      security: v.security,
      priority: v.priority,
      discount: Number(v.discount),
      memo: v.memo,
    };
  }

  function recalculate() {
    const v = getValues();
    startCalculating(async () => {
      try {
        const result = await calculateQuotePreviewAction(toInputs(v), contract.months);
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
              <Label htmlFor="ap">{tCalc("apCount")}</Label>
              <Input id="ap" type="number" {...register("ap")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hub">{tCalc("hubCount")}</Label>
              <Input id="hub" type="number" {...register("hub")} />
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
              <Input id="discount" type="number" {...register("discount")} />
            </div>
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
              value={formatRupiah(preview.monthly)}
              metrics={[
                { label: t("currentMonthly"), value: formatRupiah(contract.monthly_fee) },
                { label: t("monthlyDiff"), value: formatRupiah(diff ?? 0) },
              ]}
            />
          ) : (
            <p className="text-muted-foreground">{t("resultPlaceholder")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
