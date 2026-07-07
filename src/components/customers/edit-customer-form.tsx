"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCustomerAction } from "@/app/[locale]/(dashboard)/customers/actions";
import type { Customer } from "@/types/domain";

const schema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  invoice_email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  memo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Only rendered for `master`, who receives the unmasked customer record —
 * a `staff` viewer editing this form would silently overwrite real values
 * with the masked placeholders, so this form is master-only by convention. */
export function EditCustomerForm({ customer }: { customer: Customer }) {
  const t = useTranslations("customers");
  const tCommon = useTranslations("common");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name,
      contact: customer.contact ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      invoice_email: customer.invoice_email ?? "",
      address: customer.address ?? "",
      memo: customer.memo ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await updateCustomerAction(customer.code, values);
      toast.success(t("updateSuccess"));
    } catch {
      toast.error(t("updateError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("editInfo")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" {...register("name")} />
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
            <Label htmlFor="memo">{t("memo")}</Label>
            <Textarea id="memo" {...register("memo")} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {tCommon("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
