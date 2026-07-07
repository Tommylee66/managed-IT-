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
import { createCustomerAction } from "@/app/[locale]/(dashboard)/customers/actions";
import type { Agent } from "@/types/domain";

export function CreateCustomerDialog({ agents }: { agents: Agent[] }) {
  const t = useTranslations("customers");
  const [open, setOpen] = useState(false);

  const schema = z.object({
    name: z.string().min(1, t("nameRequired")),
    tax_id: z.string().optional(),
    contact: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    invoice_email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    memo: z.string().optional(),
    agent_code: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await createCustomerAction(values);
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
        <Button>{t("newCustomer")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tax_id">{t("taxIdLabel")}</Label>
              <Input id="tax_id" {...register("tax_id")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">{t("contact")}</Label>
              <Input id="contact" {...register("contact")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label htmlFor="invoice_email">{t("invoiceEmail")}</Label>
              <Input id="invoice_email" type="email" {...register("invoice_email")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("assignedAgent")}</Label>
            <Select onValueChange={(v) => setValue("agent_code", v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("noAgentSelected")} />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.code} value={a.code}>
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
