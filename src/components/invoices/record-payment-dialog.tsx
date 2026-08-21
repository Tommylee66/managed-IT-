"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recordInvoicePaymentAction } from "@/app/[locale]/(dashboard)/invoices/actions";

const schema = z.object({
  paidAmount: z.string().min(1),
  paidDate: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function RecordPaymentDialog({
  invoiceNo,
  currentPaidAmount,
  currentPaidAt,
}: {
  invoiceNo: string;
  currentPaidAmount: number | null;
  currentPaidAt: string | null;
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as Locale;
  const [open, setOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidAmount: currentPaidAmount?.toString() ?? "",
      paidDate: currentPaidAt ? currentPaidAt.slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await recordInvoicePaymentAction(
        invoiceNo,
        Number(values.paidAmount),
        new Date(`${values.paidDate}T00:00:00`).toISOString()
      );
      toast.success(t("recordPaymentSuccess"));
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("recordPaymentError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("recordPayment")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recordPayment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="paidAmount">{t("paidAmount")}</Label>
            <Controller
              control={control}
              name="paidAmount"
              render={({ field }) => (
                <CurrencyInput
                  id="paidAmount"
                  locale={locale}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="paidDate">{t("paidDate")}</Label>
            <Input id="paidDate" type="date" {...register("paidDate")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("recording") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
