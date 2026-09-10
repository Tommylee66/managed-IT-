"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Asset, Contract, ServiceCatalogItem } from "@/types/domain";

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
}

const today = new Date().toISOString().slice(0, 10);

export function ActivationForm({
  contracts,
  assets,
  services,
  defaultContractNo,
}: {
  contracts: Contract[];
  assets: Asset[];
  services: ServiceCatalogItem[];
  defaultContractNo?: string;
}) {
  const t = useTranslations("activations");
  const tAssets = useTranslations("assets");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractNo, setContractNo] = useState(defaultContractNo ?? "");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [serviceDetails, setServiceDetails] = useState<Record<string, string>>({});
  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      contract_no: defaultContractNo ?? "",
      date: today,
      billing_date: today,
      status: "activated",
    },
  });

  const selectedContract = contracts.find((contract) => contract.no === contractNo);
  const availableAssets = selectedContract
    ? assets.filter(
        (asset) =>
          (asset.contract_no == null || asset.contract_no === selectedContract.no) &&
          (asset.customer_code == null || asset.customer_code === selectedContract.customer_code)
      )
    : [];

  function handleContractChange(value: string) {
    setContractNo(value);
    setValue("contract_no", value);
    setSelectedAssetIds([]);
  }

  function toggleAsset(assetId: string, checked: boolean) {
    setSelectedAssetIds((current) =>
      checked ? [...current, assetId] : current.filter((id) => id !== assetId)
    );
  }

  function toggleService(catalogId: string, checked: boolean) {
    setServiceDetails((current) => {
      const next = { ...current };
      if (checked) next[catalogId] = next[catalogId] ?? "";
      else delete next[catalogId];
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    if (!values.contract_no) {
      toast.error(t("selectContractError"));
      return;
    }
    if (!selectedAssetIds.length) {
      toast.error(t("assetsRequiredError"));
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
        asset_ids: selectedAssetIds,
        services: Object.entries(serviceDetails).map(([catalogId, detail]) => ({
          catalogId,
          detail,
        })),
      });
      toast.success(t("saveSuccess"));
      router.push(`/${locale}/activations/${activation.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"));
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
          <div className="col-span-2 flex flex-col gap-2 md:col-span-3">
            <Label>{t("contract")}</Label>
            <Select value={contractNo || undefined} onValueChange={handleContractChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.no} value={contract.no}>
                    {contract.no} - {contract.customer_name}
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
              onValueChange={(value) => setValue("status", value as FormValues["status"])}
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
            <Input
              id="confirm_type"
              placeholder={t("confirmTypePlaceholder")}
              {...register("confirm_type")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="security_summary">{t("securitySummary")}</Label>
            <Input id="security_summary" {...register("security_summary")} />
          </div>
          <div className="col-span-2 flex flex-col gap-2 md:col-span-3">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("installedAssetsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!selectedContract && (
            <p className="text-sm text-muted-foreground">{t("selectContractForAssets")}</p>
          )}
          {selectedContract && availableAssets.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noAvailableAssets")}</p>
          )}
          {availableAssets.map((asset) => {
            const checked = selectedAssetIds.includes(asset.id);
            return (
              <label
                key={asset.id}
                htmlFor={`activation-asset-${asset.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <Checkbox
                  id={`activation-asset-${asset.id}`}
                  checked={checked}
                  onCheckedChange={(value) => toggleAsset(asset.id, value === true)}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <span className="font-medium">
                    {asset.asset_id} · {asset.name || "-"}
                    {asset.model ? ` / ${asset.model}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {asset.owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}
                    {` · ${asset.type} · ${asset.condition} · ${tAssets("qty")} ${asset.qty}`}
                  </span>
                  {asset.activation_id && (
                    <span className="text-xs text-muted-foreground">
                      {t("linkedActivation", { id: asset.activation_id })}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
          {availableAssets.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("selectedAssetsCount", { count: selectedAssetIds.length })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activationServicesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("noServicesAvailable")}</p>
          )}
          {services.map((service) => {
            const checked = Object.prototype.hasOwnProperty.call(serviceDetails, service.id);
            const name = locale === "ko" ? service.name_ko : service.name_id;
            const description = locale === "ko" ? service.description_ko : service.description_id;
            return (
              <div key={service.id} className="rounded-md border p-3">
                <label
                  htmlFor={`activation-service-${service.id}`}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id={`activation-service-${service.id}`}
                    checked={checked}
                    onCheckedChange={(value) => toggleService(service.id, value === true)}
                  />
                  <span className="flex flex-1 flex-col gap-1 text-sm">
                    <span className="font-medium">{name}</span>
                    {description && <span className="text-muted-foreground">{description}</span>}
                  </span>
                </label>
                {checked && (
                  <div className="mt-3 flex flex-col gap-2 pl-7">
                    <Label htmlFor={`activation-service-detail-${service.id}`}>
                      {t("serviceDetailLabel")}
                    </Label>
                    <Textarea
                      id={`activation-service-detail-${service.id}`}
                      maxLength={4000}
                      placeholder={t("serviceDetailPlaceholder")}
                      value={serviceDetails[service.id]}
                      onChange={(event) =>
                        setServiceDetails((current) => ({
                          ...current,
                          [service.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? t("saving") : t("saveActivation")}
      </Button>
    </form>
  );
}
