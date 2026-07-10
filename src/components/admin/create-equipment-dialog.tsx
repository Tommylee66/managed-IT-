"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createEquipmentCatalogItemAction } from "@/app/[locale]/(dashboard)/admin/equipment/actions";
import type { AssetType } from "@/types/domain";

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

export function CreateEquipmentDialog() {
  const t = useTranslations("admin");
  const tCat = useTranslations("equipmentCategory");
  const [open, setOpen] = useState(false);

  const schema = z.object({
    category: z.enum(CATEGORIES as [AssetType, ...AssetType[]]),
    model_name: z.string().min(1, t("equipmentModelRequired")),
    spec_id: z.string().optional(),
    spec_ko: z.string().optional(),
    monthly_rate: z.string().optional(),
    monthly_cost: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category: "ap" } });

  async function onSubmit(values: FormValues) {
    try {
      await createEquipmentCatalogItemAction({
        ...values,
        monthly_rate: values.monthly_rate ? Number(values.monthly_rate) : null,
        monthly_cost: values.monthly_cost ? Number(values.monthly_cost) : null,
      });
      toast.success(t("equipmentCreateSuccess"));
      reset();
      setOpen(false);
    } catch {
      toast.error(t("equipmentCreateError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("newEquipment")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("equipmentCreateDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("equipmentCategory")}</Label>
            <Select defaultValue="ap" onValueChange={(v) => setValue("category", v as AssetType)}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_rate">{t("equipmentMonthlyRate")}</Label>
              <Input id="monthly_rate" type="number" {...register("monthly_rate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="monthly_cost">{t("equipmentMonthlyCost")}</Label>
              <Input id="monthly_cost" type="number" {...register("monthly_cost")} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("equipmentRateHint")}</p>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
