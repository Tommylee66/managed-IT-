"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createServiceLogAction } from "@/app/[locale]/(dashboard)/service-logs/actions";
import type { Customer } from "@/types/domain";

const TYPE_OPTIONS = [
  { value: "장애대응", key: "typeIncidentResponse" },
  { value: "정기점검", key: "typeRegularCheck" },
  { value: "자산변경", key: "typeAssetChange" },
  { value: "장비교체", key: "typeEquipmentSwap" },
  { value: "설정변경", key: "typeConfigChange" },
  { value: "요금변경", key: "typeFeeChange" },
  { value: "서비스 추가", key: "typeServiceAdd" },
  { value: "서비스 삭제", key: "typeServiceRemove" },
  { value: "고객요청", key: "typeCustomerRequest" },
  { value: "기타", key: "typeOther" },
] as const;

interface FormValues {
  customer_code: string;
  date: string;
  type: string;
  title: string;
  memo: string;
}

export function CreateServiceLogDialog({ customers }: { customers: Customer[] }) {
  const t = useTranslations("serviceLogs");
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10), type: TYPE_OPTIONS[0].value },
  });

  async function onSubmit(values: FormValues) {
    if (!values.customer_code) {
      toast.error(t("selectCustomerError"));
      return;
    }
    try {
      await createServiceLogAction(values);
      toast.success(t("saveSuccess"));
      reset();
      setOpen(false);
    } catch {
      toast.error(t("saveError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("newLog")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("formTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("customer")}</Label>
            <Select onValueChange={(v) => setValue("customer_code", v)}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("type")}</Label>
              <Select defaultValue={TYPE_OPTIONS[0].value} onValueChange={(v) => setValue("type", v)}>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{t("logTitle")}</Label>
            <Input id="title" placeholder={t("titlePlaceholder")} {...register("title")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("memoLabel")}</Label>
            <Textarea id="memo" {...register("memo")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
