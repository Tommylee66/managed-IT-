"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/config/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createEquipmentCatalogItemAction,
  updateEquipmentCatalogItemAction,
} from "@/app/[locale]/(dashboard)/admin/rates/actions";
import type { AssetType, EquipmentCatalogItem } from "@/types/domain";

const CATEGORIES: AssetType[] = [
  "router",
  "ap",
  "hub_switch",
  "cctv",
  "security",
  "vpn_config",
  "starlink",
  "pc_server",
  "printer",
  "other",
];

// Purchase price is a one-time cost; suggesting a monthly figure amortizes
// it over a fixed period rather than the contract term (which varies per
// customer) — 24 months is a plain, easy-to-explain default. Master can
// always type over the suggestion before saving.
const SUGGESTION_MONTHS = 24;

function suggestMonthly(purchasePrice: number): number {
  return Math.round(purchasePrice / SUGGESTION_MONTHS / 1000) * 1000;
}

export function EquipmentDialog({ item }: { item?: EquipmentCatalogItem }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("equipmentCategory");
  const params = useParams();
  const locale = params.locale as Locale;
  const [open, setOpen] = useState(false);
  const isEdit = !!item;
  const [rateTouched, setRateTouched] = useState(!!item?.monthly_rate);
  const [costTouched, setCostTouched] = useState(!!item?.monthly_cost);

  const schema = z.object({
    category: z.enum(CATEGORIES as [AssetType, ...AssetType[]]),
    model_name: z.string().min(1, t("equipmentModelRequired")),
    spec_id: z.string().optional(),
    spec_ko: z.string().optional(),
    purchase_price: z.string().optional(),
    monthly_rate: z.string().optional(),
    monthly_cost: z.string().optional(),
    overage_rate: z.string().optional(),
    overage_cost: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: item?.category ?? "ap",
      model_name: item?.model_name ?? "",
      spec_id: item?.spec_id ?? "",
      spec_ko: item?.spec_ko ?? "",
      purchase_price: item?.purchase_price?.toString() ?? "",
      monthly_rate: item?.monthly_rate?.toString() ?? "",
      monthly_cost: item?.monthly_cost?.toString() ?? "",
      overage_rate: item?.overage_rate?.toString() ?? "",
      overage_cost: item?.overage_cost?.toString() ?? "",
    },
  });

  function onPurchasePriceChange(value: string) {
    setValue("purchase_price", value);
    const price = Number(value);
    if (!price) return;
    const suggested = suggestMonthly(price);
    if (!rateTouched) setValue("monthly_rate", String(suggested));
    if (!costTouched) setValue("monthly_cost", String(suggested));
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      category: values.category,
      model_name: values.model_name,
      spec_id: values.spec_id,
      spec_ko: values.spec_ko,
      purchase_price: values.purchase_price ? Number(values.purchase_price) : null,
      monthly_rate: values.monthly_rate ? Number(values.monthly_rate) : null,
      monthly_cost: values.monthly_cost ? Number(values.monthly_cost) : null,
      overage_rate: values.overage_rate ? Number(values.overage_rate) : null,
      overage_cost: values.overage_cost ? Number(values.overage_cost) : null,
    };
    try {
      if (isEdit) {
        await updateEquipmentCatalogItemAction(item.id, payload);
        toast.success(t("equipmentUpdateSuccess"));
      } else {
        await createEquipmentCatalogItemAction(payload);
        toast.success(t("equipmentCreateSuccess"));
        reset();
      }
      setOpen(false);
    } catch {
      toast.error(isEdit ? t("equipmentUpdateError") : t("equipmentCreateError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            {tCommon("edit")}
          </Button>
        ) : (
          <Button>{t("newEquipment")}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("equipmentEditDialogTitle") : t("equipmentCreateDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("equipmentCategory")}</Label>
            <Select
              defaultValue={item?.category ?? "ap"}
              onValueChange={(v) => setValue("category", v as AssetType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {tCat(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model_name">{t("equipmentModelName")}</Label>
            <Input id="model_name" {...register("model_name")} />
            {errors.model_name && (
              <p className="text-sm text-destructive">{errors.model_name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="spec_id">{t("equipmentSpecId")}</Label>
            <Input id="spec_id" {...register("spec_id")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="spec_ko">{t("equipmentSpecKo")}</Label>
            <Input id="spec_ko" {...register("spec_ko")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase_price">{t("equipmentPurchasePrice")}</Label>
            <Controller
              control={control}
              name="purchase_price"
              render={({ field }) => (
                <CurrencyInput
                  id="purchase_price"
                  locale={locale}
                  value={field.value ?? ""}
                  onChange={(digits) => {
                    field.onChange(digits);
                    onPurchasePriceChange(digits);
                  }}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">{t("equipmentPurchasePriceHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_rate">{t("equipmentMonthlyRate")}</Label>
              <Controller
                control={control}
                name="monthly_rate"
                render={({ field }) => (
                  <CurrencyInput
                    id="monthly_rate"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={(digits) => {
                      field.onChange(digits);
                      setRateTouched(true);
                    }}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_cost">{t("equipmentMonthlyCost")}</Label>
              <Controller
                control={control}
                name="monthly_cost"
                render={({ field }) => (
                  <CurrencyInput
                    id="monthly_cost"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={(digits) => {
                      field.onChange(digits);
                      setCostTouched(true);
                    }}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("equipmentRateHint")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="overage_rate">{t("equipmentOverageRate")}</Label>
              <Controller
                control={control}
                name="overage_rate"
                render={({ field }) => (
                  <CurrencyInput
                    id="overage_rate"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="overage_cost">{t("equipmentOverageCost")}</Label>
              <Controller
                control={control}
                name="overage_cost"
                render={({ field }) => (
                  <CurrencyInput
                    id="overage_cost"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("equipmentOverageHint")}</p>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : isEdit ? tCommon("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
