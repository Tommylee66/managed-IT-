"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { createAssetAction, updateAssetAction } from "@/app/[locale]/(dashboard)/assets/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSET_CONDITIONS,
  ASSET_OWNERS,
  ASSET_STATUSES,
  ASSET_TYPES,
  type AssetEditorInput,
} from "@/lib/assets/constants";
import type { Asset } from "@/types/domain";

const NONE = "__none__";

const formSchema = z.object({
  customer_code: z.string(),
  contract_no: z.string(),
  type: z.enum(ASSET_TYPES),
  owner: z.enum(ASSET_OWNERS),
  name: z.string().trim().min(1).max(255),
  model: z.string().max(255),
  serial: z.string().max(4000),
  qty: z.number().int().min(1).max(100000),
  location: z.string().max(255),
  condition: z.enum(ASSET_CONDITIONS),
  warranty: z.string().max(100),
  notes: z.string().max(4000),
  status: z.enum(ASSET_STATUSES),
});

type FormValues = z.infer<typeof formSchema>;
type CustomerOption = { code: string; name: string };
type ContractOption = { no: string; customer_code: string; customer_name: string };

function emptyToNull(value: string): string | null {
  return value.trim() || null;
}

export function AssetDialog({
  asset,
  customers,
  contracts,
}: {
  asset?: Asset;
  customers: CustomerOption[];
  contracts: ContractOption[];
}) {
  const t = useTranslations("assets");
  const tCommon = useTranslations("common");
  const tCategory = useTranslations("equipmentCategory");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(asset);

  const initialValues: FormValues = {
    customer_code: asset?.customer_code ?? "",
    contract_no: asset?.contract_no ?? "",
    type: asset?.type ?? "router",
    owner: asset?.owner ?? "bct",
    name: asset?.name ?? "",
    model: asset?.model ?? "",
    serial: asset?.serial ?? "",
    qty: asset?.qty ?? 1,
    location: asset?.location ?? "",
    condition: asset?.condition ?? "pending",
    warranty: asset?.warranty ?? "",
    notes: asset?.notes ?? "",
    status: asset?.status === "inactive" ? "inactive" : "active",
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const selectedCustomerCode = useWatch({ control, name: "customer_code" });
  const selectedContractNo = useWatch({ control, name: "contract_no" });
  const availableContracts = useMemo(
    () =>
      selectedCustomerCode
        ? contracts.filter((contract) => contract.customer_code === selectedCustomerCode)
        : contracts,
    [contracts, selectedCustomerCode]
  );

  function changeCustomer(customerCode: string) {
    setValue("customer_code", customerCode, { shouldValidate: true });
    const currentContract = contracts.find((contract) => contract.no === selectedContractNo);
    if (!customerCode || (currentContract && currentContract.customer_code !== customerCode)) {
      setValue("contract_no", "", { shouldValidate: true });
    }
  }

  function changeContract(contractNo: string) {
    setValue("contract_no", contractNo, { shouldValidate: true });
    const contract = contracts.find((candidate) => candidate.no === contractNo);
    if (contract) {
      setValue("customer_code", contract.customer_code, { shouldValidate: true });
    }
  }

  async function onSubmit(values: FormValues) {
    const payload: AssetEditorInput = {
      customer_code: emptyToNull(values.customer_code),
      contract_no: emptyToNull(values.contract_no),
      type: values.type,
      owner: values.owner,
      name: values.name.trim(),
      model: emptyToNull(values.model),
      serial: emptyToNull(values.serial),
      qty: values.qty,
      location: emptyToNull(values.location),
      condition: values.condition,
      warranty: emptyToNull(values.warranty),
      notes: emptyToNull(values.notes),
      status: values.status,
    };

    try {
      if (asset) {
        await updateAssetAction(asset.id, payload);
        toast.success(t("updateSuccess"));
      } else {
        await createAssetAction(payload);
        toast.success(t("createSuccess"));
      }
      setOpen(false);
      reset(initialValues);
      router.refresh();
    } catch {
      toast.error(isEdit ? t("updateError") : t("createError"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset(initialValues);
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            {tCommon("edit")}
          </Button>
        ) : (
          <Button>{t("newAsset")}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {asset && (
            <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{t("assetNo")}: {asset.asset_id}</span>
              {asset.activation_id && (
                <span className="ml-3 text-muted-foreground">
                  {t("linkedActivation")}: {asset.activation_id}
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("customer")}</Label>
              <Controller
                control={control}
                name="customer_code"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => changeCustomer(value === NONE ? "" : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("noCustomer")}</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.code} value={customer.code}>
                          {customer.code} · {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("contract")}</Label>
              <Controller
                control={control}
                name="contract_no"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => changeContract(value === NONE ? "" : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("noContract")}</SelectItem>
                      {availableContracts.map((contract) => (
                        <SelectItem key={contract.no} value={contract.no}>
                          {contract.no} · {contract.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("type")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{tCategory(type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("owner")}</Label>
              <Controller
                control={control}
                name="owner"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_OWNERS.map((owner) => (
                        <SelectItem key={owner} value={owner}>
                          {owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`asset-name-${asset?.id ?? "new"}`}>{t("name")}</Label>
              <Input id={`asset-name-${asset?.id ?? "new"}`} {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{t("nameRequired")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`asset-model-${asset?.id ?? "new"}`}>{t("model")}</Label>
              <Input id={`asset-model-${asset?.id ?? "new"}`} {...register("model")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`asset-serial-${asset?.id ?? "new"}`}>{t("serial")}</Label>
            <Textarea id={`asset-serial-${asset?.id ?? "new"}`} rows={3} {...register("serial")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`asset-qty-${asset?.id ?? "new"}`}>{t("qty")}</Label>
              <Input
                id={`asset-qty-${asset?.id ?? "new"}`}
                type="number"
                min={1}
                max={100000}
                {...register("qty", { valueAsNumber: true })}
              />
              {errors.qty && <p className="text-sm text-destructive">{t("qtyInvalid")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`asset-location-${asset?.id ?? "new"}`}>{t("installLocation")}</Label>
              <Input id={`asset-location-${asset?.id ?? "new"}`} {...register("location")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("condition")}</Label>
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {t(`condition_${condition}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`asset-warranty-${asset?.id ?? "new"}`}>{t("warranty")}</Label>
              <Input id={`asset-warranty-${asset?.id ?? "new"}`} {...register("warranty")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("status")}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "active" ? tCommon("active") : tCommon("inactive")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`asset-notes-${asset?.id ?? "new"}`}>{t("notes")}</Label>
            <Textarea id={`asset-notes-${asset?.id ?? "new"}`} rows={3} {...register("notes")} />
          </div>

          <p className="text-xs text-muted-foreground">{t("historyNotice")}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
