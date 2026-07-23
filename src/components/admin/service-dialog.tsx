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
    name: z.string().min(1, t("serviceNameRequired")),
    description: z.string().optional(),
    monthly_rate: z.string().optional(),
    monthly_cost: z.string().optional(),
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
      name: item?.name ?? "",
      description: item?.description ?? "",
      monthly_rate: item?.monthly_rate?.toString() ?? "",
      monthly_cost: item?.monthly_cost?.toString() ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description,
      monthly_rate: values.monthly_rate ? Number(values.monthly_rate) : null,
      monthly_cost: values.monthly_cost ? Number(values.monthly_cost) : null,
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
            <Label htmlFor="name">{t("serviceName")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("serviceDescription")}</Label>
            <Textarea id="description" rows={2} {...register("description")} />
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
