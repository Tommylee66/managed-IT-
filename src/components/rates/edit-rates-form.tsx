"use client";

import { useParams } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRatesAction } from "@/app/[locale]/(dashboard)/admin/rates/actions";
import type { Rates } from "@/types/domain";
import type { Locale } from "@/config/constants";

interface FormValues {
  base_monthly: number;
  contract24_addon: number;
  employee_unit: number;
  cctv_block: number;
  ppn: number;
  locations: { name: string; fee: number; cost: number }[];
  cost_fields_json: string;
  init_fields_json: string;
  commission_items_json: string;
}

const CURRENCY_FIELD_KEYS: { key: "base_monthly" | "contract24_addon" | "employee_unit" | "cctv_block"; labelKey: string }[] = [
  { key: "base_monthly", labelKey: "baseMonthly" },
  { key: "contract24_addon", labelKey: "contract24Addon" },
  { key: "employee_unit", labelKey: "employeeUnit" },
  { key: "cctv_block", labelKey: "cctvUnit" },
];

export function EditRatesForm({ rates }: { rates: Rates }) {
  const t = useTranslations("admin");
  const params = useParams();
  const locale = params.locale as Locale;
  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      base_monthly: rates.base_monthly,
      contract24_addon: rates.contract24_addon,
      employee_unit: rates.employee_unit,
      cctv_block: rates.cctv_block,
      ppn: rates.ppn,
      locations: rates.locations,
      cost_fields_json: JSON.stringify(rates.cost_fields, null, 2),
      init_fields_json: JSON.stringify(rates.init_fields, null, 2),
      commission_items_json: JSON.stringify(rates.commission_items, null, 2),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "locations" });

  async function onSubmit(values: FormValues) {
    try {
      const cost_fields = JSON.parse(values.cost_fields_json);
      const init_fields = JSON.parse(values.init_fields_json);
      const commission_items = JSON.parse(values.commission_items_json);
      const { cost_fields_json, init_fields_json, commission_items_json, ...rest } = values;
      void cost_fields_json;
      void init_fields_json;
      void commission_items_json;
      await updateRatesAction({ ...rest, cost_fields, init_fields, commission_items });
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("billingRates")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {CURRENCY_FIELD_KEYS.map((f) => (
            <div key={f.key} className="flex flex-col gap-2">
              <Label htmlFor={f.key}>{t(f.labelKey)}</Label>
              <Controller
                control={control}
                name={f.key}
                render={({ field }) => (
                  <CurrencyInput
                    id={f.key}
                    locale={locale}
                    value={String(field.value ?? "")}
                    onChange={(digits) => field.onChange(digits ? Number(digits) : 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ppn">{t("ppnRate")}</Label>
            <Input id="ppn" type="number" {...register("ppn", { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("locationRates")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {fields.map((locationField, i) => (
            <div key={locationField.id} className="grid grid-cols-[1fr_140px_140px_auto] gap-2">
              <Input placeholder={t("locationName")} {...register(`locations.${i}.name` as const)} />
              <Controller
                control={control}
                name={`locations.${i}.fee` as const}
                render={({ field }) => (
                  <CurrencyInput
                    locale={locale}
                    placeholder={t("customerFee")}
                    value={String(field.value ?? "")}
                    onChange={(digits) => field.onChange(digits ? Number(digits) : 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Controller
                control={control}
                name={`locations.${i}.cost` as const}
                render={({ field }) => (
                  <CurrencyInput
                    locale={locale}
                    placeholder={t("internalCost")}
                    value={String(field.value ?? "")}
                    onChange={(digits) => field.onChange(digits ? Number(digits) : 0)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Button type="button" variant="outline" onClick={() => remove(i)}>
                {t("delete")}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => append({ name: "", fee: 0, cost: 0 })}
          >
            {t("addLocation")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("advancedSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cost_fields_json">{t("costFieldsJson")}</Label>
            <Textarea id="cost_fields_json" rows={8} className="font-mono text-xs" {...register("cost_fields_json")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="init_fields_json">{t("initFieldsJson")}</Label>
            <Textarea id="init_fields_json" rows={6} className="font-mono text-xs" {...register("init_fields_json")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commission_items_json">{t("commissionItemsJson")}</Label>
            <Textarea id="commission_items_json" rows={6} className="font-mono text-xs" {...register("commission_items_json")} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? t("saving") : t("saveAll")}
      </Button>
    </form>
  );
}
