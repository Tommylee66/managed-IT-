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
import { updateAgentInfoAction } from "@/app/[locale]/(dashboard)/agents/actions";
import type { Agent } from "@/types/domain";

const schema = z.object({
  phone: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  holderName: z.string().optional(),
  npwp: z.string().optional(),
  ktp: z.string().optional(),
  address: z.string().optional(),
  memo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Only rendered for `master`, who receives the unmasked agent record — a
 * `staff` viewer editing this form would silently overwrite real npwp/ktp/
 * bank values with the masked placeholders, same rule as EditCustomerForm. */
export function EditAgentForm({ agent }: { agent: Agent }) {
  const t = useTranslations("agents");
  const tCommon = useTranslations("common");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: agent.phone ?? "",
      bankName: agent.bank?.bankName ?? "",
      accountNumber: agent.bank?.accountNumber ?? "",
      holderName: agent.bank?.holderName ?? "",
      npwp: agent.npwp ?? "",
      ktp: agent.ktp ?? "",
      address: agent.address ?? "",
      memo: agent.memo ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await updateAgentInfoAction(agent.code, {
        phone: values.phone,
        bank: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          holderName: values.holderName,
        },
        npwp: values.npwp,
        ktp: values.ktp,
        address: values.address,
        memo: values.memo,
      });
      toast.success(t("updateSuccess"));
    } catch {
      toast.error(t("changeError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("editInfo")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" {...register("phone")} />
            </div>
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
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {tCommon("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
