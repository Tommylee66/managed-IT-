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
import { createIncidentLogAction } from "@/app/[locale]/(dashboard)/incident-logs/actions";
import type { Customer, IncidentLogType } from "@/types/domain";

interface FormValues {
  customer_code: string;
  type: IncidentLogType;
  occurred_date: string;
  title: string;
  description: string;
  resolution: string;
  engineer: string;
  memo: string;
}

export function CreateIncidentLogDialog({ customers }: { customers: Customer[] }) {
  const t = useTranslations("incidentLogs");
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { occurred_date: new Date().toISOString().slice(0, 10), type: "incident" },
  });

  async function onSubmit(values: FormValues) {
    if (!values.customer_code) {
      toast.error(t("selectCustomerError"));
      return;
    }
    try {
      await createIncidentLogAction(values);
      toast.success(t("saveSuccess"));
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(`${t("saveError")}${e instanceof Error ? ` (${e.message})` : ""}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("newLog")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              <Label>{t("type")}</Label>
              <Select defaultValue="incident" onValueChange={(v) => setValue("type", v as IncidentLogType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">{t("typeIncident")}</SelectItem>
                  <SelectItem value="inspection">{t("typeInspection")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="occurred_date">{t("occurredDate")}</Label>
              <Input id="occurred_date" type="date" {...register("occurred_date")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{t("logTitle")}</Label>
            <Input id="title" placeholder={t("titlePlaceholder")} {...register("title")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="resolution">{t("resolution")}</Label>
            <Textarea id="resolution" rows={3} {...register("resolution")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="engineer">{t("engineer")}</Label>
              <Input id="engineer" {...register("engineer")} />
            </div>
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
