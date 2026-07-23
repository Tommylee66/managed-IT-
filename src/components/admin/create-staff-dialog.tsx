"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const ROLES = ["admin_dept", "activation_dept", "sales_agent", "master"] as const;

type FormValues = {
  full_name: string;
  email: string;
  password: string;
  role: (typeof ROLES)[number];
};

export function CreateStaffDialog() {
  const t = useTranslations("admin");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const schema = z.object({
    full_name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(8, t("passwordTooShort")),
    role: z.enum(ROLES),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "admin_dept" } });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? t("createError"));
      return;
    }
    toast.success(t("createSuccess"));
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("newStaffAccount")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createStaffTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">{t("name")}</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("initialPassword")}</Label>
            <Input id="password" type="text" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("role")}</Label>
            <Select defaultValue="admin_dept" onValueChange={(v) => setValue("role", v as FormValues["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {tRoles(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
