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
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createServiceCatalogItemAction,
  updateServiceCatalogItemAction,
} from "@/app/[locale]/(dashboard)/admin/rates/actions";
import type { ServiceCatalogItem } from "@/types/domain";

export function ServiceDialog({ item }: { item?: ServiceCatalogItem }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as Locale;
  const [open, setOpen] = useState(false);
  const isEdit = !!item;

  const schema = z.object({
    name_id: z.string().min(1, t("serviceNameRequired")),
    name_ko: z.string().min(1, t("serviceNameRequired")),
    description_id: z.string().optional(),
    description_ko: z.string().optional(),
    monthly_rate: z.string().optional(),
    monthly_cost: z.string().optional(),
    one_time_fee: z.string().optional(),
    one_time_cost: z.string().optional(),
    one_time_billing_mode: z.enum(["one_time", "monthly"]),
    commission_rate_override: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_id: item?.name_id ?? "",
      name_ko: item?.name_ko ?? "",
      description_id: item?.description_id ?? "",
      description_ko: item?.description_ko ?? "",
      monthly_rate: item?.monthly_rate?.toString() ?? "",
      monthly_cost: item?.monthly_cost?.toString() ?? "",
      one_time_fee: item?.one_time_fee?.toString() ?? "",
      one_time_cost: item?.one_time_cost?.toString() ?? "",
      one_time_billing_mode: item?.one_time_billing_mode ?? "one_time",
      commission_rate_override: item?.commission_rate_override?.toString() ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      name_id: values.name_id,
      name_ko: values.name_ko,
      description_id: values.description_id,
      description_ko: values.description_ko,
      monthly_rate: values.monthly_rate ? Number(values.monthly_rate) : null,
      monthly_cost: values.monthly_cost ? Number(values.monthly_cost) : null,
      one_time_fee: values.one_time_fee ? Number(values.one_time_fee) : null,
      one_time_cost: values.one_time_cost ? Number(values.one_time_cost) : null,
      one_time_billing_mode: values.one_time_billing_mode,
      commission_rate_override: values.commission_rate_override ? Number(values.commission_rate_override) : null,
    };
    try {
      if (isEdit) {
        await updateServiceCatalogItemAction(item.id, payload);
        toast.success(t("serviceUpdateSuccess"));
      } else {
        await createServiceCatalogItemAction(payload);
        toast.success(t("serviceCreateSuccess"));
        reset();
      }
      setOpen(false);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      toast.error(`${isEdit ? t("serviceUpdateError") : t("serviceCreateError")} (${reason})`);
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
          <Button>{t("newService")}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("serviceEditDialogTitle") : t("serviceCreateDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name_id">{t("serviceNameId")}</Label>
            <Input id="name_id" {...register("name_id")} />
            {errors.name_id && <p className="text-sm text-destructive">{errors.name_id.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name_ko">{t("serviceNameKo")}</Label>
            <Input id="name_ko" {...register("name_ko")} />
            {errors.name_ko && <p className="text-sm text-destructive">{errors.name_ko.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description_id">{t("serviceDescriptionId")}</Label>
            <Textarea id="description_id" rows={2} {...register("description_id")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description_ko">{t("serviceDescriptionKo")}</Label>
            <Textarea id="description_ko" rows={2} {...register("description_ko")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_rate">{t("serviceMonthlyRate")}</Label>
              <Controller
                control={control}
                name="monthly_rate"
                render={({ field }) => (
                  <CurrencyInput
                    id="monthly_rate"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_cost">{t("serviceMonthlyCost")}</Label>
              <Controller
                control={control}
                name="monthly_cost"
                render={({ field }) => (
                  <CurrencyInput
                    id="monthly_cost"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("serviceRateHint")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="one_time_fee">{t("serviceOneTimeFee")}</Label>
              <Controller
                control={control}
                name="one_time_fee"
                render={({ field }) => (
                  <CurrencyInput
                    id="one_time_fee"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="one_time_cost">{t("serviceOneTimeCost")}</Label>
              <Controller
                control={control}
                name="one_time_cost"
                render={({ field }) => (
                  <CurrencyInput
                    id="one_time_cost"
                    locale={locale}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("serviceBillingMode")}</Label>
            <Controller
              control={control}
              name="one_time_billing_mode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">{t("serviceBillingModeOneTime")}</SelectItem>
                    <SelectItem value="monthly">{t("serviceBillingModeMonthly")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("serviceOneTimeFeeHint")}</p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="commission_rate_override">{t("commissionRateOverride")}</Label>
            <Input
              id="commission_rate_override"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register("commission_rate_override")}
            />
            <p className="text-xs text-muted-foreground">{t("commissionRateOverrideHint")}</p>
          </div>
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
