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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAgentAction } from "@/app/[locale]/(dashboard)/agents/actions";

export function CreateAgentDialog() {
  const t = useTranslations("agents");
  const [open, setOpen] = useState(false);

  const schema = z.object({
    name: z.string().min(1, t("nameRequired")),
    rate: z.number().min(0).max(100),
    phone: z.string().optional(),
    email: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    holderName: z.string().optional(),
    npwp: z.string().optional(),
    ktp: z.string().optional(),
    address: z.string().optional(),
    memo: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rate: 10 } });

  async function onSubmit(values: FormValues) {
    try {
      await createAgentAction({
        name: values.name,
        rate: values.rate,
        phone: values.phone,
        email: values.email,
        npwp: values.npwp,
        ktp: values.ktp,
        address: values.address,
        memo: values.memo,
        first_date: new Date().toISOString().slice(0, 10),
        bank: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          holderName: values.holderName,
        },
      });
      toast.success(t("createSuccess"));
      reset();
      setOpen(false);
    } catch {
      toast.error(t("createError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("newAgent")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rate">{t("rateLabel")}</Label>
            <Input id="rate" type="number" step="0.1" {...register("rate", { valueAsNumber: true })} />
            {errors.rate && <p className="text-sm text-destructive">{errors.rate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bankName">{t("bankName")}</Label>
              <Input id="bankName" {...register("bankName")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accountNumber">{t("accountNumber")}</Label>
              <Input id="accountNumber" {...register("accountNumber")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="holderName">{t("holderName")}</Label>
              <Input id="holderName" {...register("holderName")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="npwp">{t("npwp")}</Label>
              <Input id="npwp" {...register("npwp")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ktp">{t("ktp")}</Label>
              <Input id="ktp" {...register("ktp")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("memo")}</Label>
            <Textarea id="memo" {...register("memo")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("registering") : t("register")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
