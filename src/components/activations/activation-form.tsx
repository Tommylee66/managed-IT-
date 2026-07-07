"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createActivationAction } from "@/app/[locale]/(dashboard)/activations/actions";
import type { Contract, AssetType, AssetOwner, AssetCondition } from "@/types/domain";

const TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "router", label: "Router" },
  { value: "ap", label: "AP" },
  { value: "hub_switch", label: "Hub/Switch" },
  { value: "cctv", label: "CCTV" },
  { value: "security", label: "Security" },
  { value: "vpn_config", label: "VPN Config" },
  { value: "starlink", label: "Starlink" },
  { value: "pc_server", label: "PC/Server" },
  { value: "printer", label: "Printer" },
  { value: "other", label: "Other" },
];

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "installed", label: "Installed" },
  { value: "pending", label: "Pending" },
  { value: "spare", label: "Spare" },
  { value: "customer_owned", label: "Customer-owned" },
  { value: "faulty", label: "Faulty" },
  { value: "returned", label: "Returned" },
  { value: "removed", label: "Removed" },
];

interface AssetRowForm {
  type: AssetType;
  owner: AssetOwner;
  name: string;
  model: string;
  serial: string;
  qty: number;
  location: string;
  condition: AssetCondition;
  warranty: string;
  notes: string;
}

interface FormValues {
  contract_no: string;
  date: string;
  billing_date: string;
  engineer: string;
  site: string;
  customer_pic: string;
  confirm_type: string;
  security_summary: string;
  status: "activated" | "pending" | "issue";
  notes: string;
  assets: AssetRowForm[];
}

const today = new Date().toISOString().slice(0, 10);
const emptyRow: AssetRowForm = {
  type: "router",
  owner: "bct",
  name: "",
  model: "",
  serial: "",
  qty: 1,
  location: "",
  condition: "installed",
  warranty: "",
  notes: "",
};

export function ActivationForm({
  contracts,
  defaultContractNo,
}: {
  contracts: Contract[];
  defaultContractNo?: string;
}) {
  const t = useTranslations("activations");
  const tAssets = useTranslations("assets");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, control, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      contract_no: defaultContractNo ?? "",
      date: today,
      billing_date: today,
      status: "activated",
      assets: [emptyRow],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "assets" });

  async function onSubmit(values: FormValues) {
    if (!values.contract_no) {
      toast.error(t("selectContractError"));
      return;
    }
    setIsSubmitting(true);
    try {
      const activation = await createActivationAction({
        contract_no: values.contract_no,
        date: values.date,
        billing_date: values.billing_date,
        engineer: values.engineer,
        site: values.site,
        customer_pic: values.customer_pic,
        confirm_type: values.confirm_type,
        security_summary: values.security_summary,
        status: values.status,
        notes: values.notes,
        assets: values.assets
          .filter((a) => a.name || a.model || a.serial || a.qty)
          .map((a) => ({ ...a, qty: Number(a.qty) })),
      });
      toast.success(t("saveSuccess"));
      router.push(`/${locale}/activations/${activation.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("formTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-2 col-span-2 md:col-span-3">
            <Label>{t("contract")}</Label>
            <Select
              defaultValue={defaultContractNo}
              onValueChange={(v) => setValue("contract_no", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.no} value={c.no}>
                    {c.no} - {c.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">{t("activationDate")}</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="billing_date">{t("billingStartDate")}</Label>
            <Input id="billing_date" type="date" {...register("billing_date")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("status")}</Label>
            <Select
              defaultValue="activated"
              onValueChange={(v) => setValue("status", v as FormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activated">{t("statusActivated")}</SelectItem>
                <SelectItem value="pending">{t("statusPending")}</SelectItem>
                <SelectItem value="issue">{t("statusIssue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="engineer">{t("engineerLabel")}</Label>
            <Input id="engineer" {...register("engineer")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="site">{t("installLocation")}</Label>
            <Input id="site" {...register("site")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer_pic">{t("sitePic")}</Label>
            <Input id="customer_pic" {...register("customer_pic")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm_type">{t("confirmType")}</Label>
            <Input id="confirm_type" placeholder={t("confirmTypePlaceholder")} {...register("confirm_type")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="security_summary">{t("securitySummary")}</Label>
            <Input id="security_summary" {...register("security_summary")} />
          </div>
          <div className="flex flex-col gap-2 col-span-2 md:col-span-3">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("installedAssetsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {fields.map((field, i) => (
            <div key={field.id} className="flex flex-col gap-2 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("type")}</Label>
                  <select
                    className="h-9 rounded-md border bg-transparent px-2 text-sm"
                    {...register(`assets.${i}.type` as const)}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("owner")}</Label>
                  <select
                    className="h-9 rounded-md border bg-transparent px-2 text-sm"
                    {...register(`assets.${i}.owner` as const)}
                  >
                    <option value="bct">BCT</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("name")}</Label>
                  <Input {...register(`assets.${i}.name` as const)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("model")}</Label>
                  <Input {...register(`assets.${i}.model` as const)} />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <Label>{tAssets("serial")}</Label>
                  <Textarea rows={2} {...register(`assets.${i}.serial` as const)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("qty")}</Label>
                  <Input type="number" {...register(`assets.${i}.qty` as const, { valueAsNumber: true })} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("installLocation")}</Label>
                  <Input {...register(`assets.${i}.location` as const)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{tAssets("condition")}</Label>
                  <select
                    className="h-9 rounded-md border bg-transparent px-2 text-sm"
                    {...register(`assets.${i}.condition` as const)}
                  >
                    {CONDITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{t("warranty")}</Label>
                  <Input {...register(`assets.${i}.warranty` as const)} />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => remove(i)}>
                {t("removeAsset")}
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => append(emptyRow)}>
            {t("addAsset")}
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? t("saving") : t("saveActivation")}
      </Button>
    </form>
  );
}
