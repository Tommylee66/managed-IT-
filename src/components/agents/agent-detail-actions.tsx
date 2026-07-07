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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeAgentRateAction, setAgentActiveAction } from "@/app/[locale]/(dashboard)/agents/actions";

const schema = z.object({
  rate: z.number().min(0).max(100),
  effectiveDate: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AgentDetailActions({ code, active }: { code: string; active: boolean }) {
  const t = useTranslations("agents");
  const [isToggling, setIsToggling] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { effectiveDate: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: FormValues) {
    try {
      await changeAgentRateAction(code, values.rate, values.effectiveDate);
      toast.success(t("rateChangeSuccess"));
    } catch {
      toast.error(t("changeError"));
    }
  }

  async function toggleActive() {
    setIsToggling(true);
    try {
      await setAgentActiveAction(code, !active);
      toast.success(active ? t("deactivateSuccess") : t("activateSuccess"));
    } catch {
      toast.error(t("changeError"));
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("adminActions")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rate">{t("newRate")}</Label>
            <Input id="rate" type="number" step="0.1" className="w-28" {...register("rate", { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="effectiveDate">{t("effectiveDate")}</Label>
            <Input id="effectiveDate" type="date" {...register("effectiveDate")} />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {t("changeRate")}
          </Button>
        </form>
        {errors.rate && <p className="text-sm text-destructive">{errors.rate.message}</p>}
        <Button variant="outline" onClick={toggleActive} disabled={isToggling} className="w-fit">
          {active ? t("deactivate") : t("activate")}
        </Button>
      </CardContent>
    </Card>
  );
}
