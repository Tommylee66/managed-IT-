"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createIpPhoneExtensionAction,
  deleteIpPhoneExtensionAction,
} from "@/app/[locale]/(dashboard)/activations/[id]/actions";
import type { IpPhoneDeviceType, IpPhoneExtension } from "@/types/domain";

interface FormValues {
  employee_name: string;
  extension_number: string;
  device_type: IpPhoneDeviceType;
  memo: string;
}

function AddIpPhoneExtensionDialog({ customerCode }: { customerCode: string }) {
  const t = useTranslations("activations");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { device_type: "sip_app" } });

  async function onSubmit(values: FormValues) {
    try {
      await createIpPhoneExtensionAction({
        customer_code: customerCode,
        employee_name: values.employee_name,
        extension_number: values.extension_number,
        device_type: values.device_type,
        memo: values.memo || null,
      });
      toast.success(t("ipPhoneSaveSuccess"));
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(`${t("ipPhoneSaveError")}${e instanceof Error ? ` (${e.message})` : ""}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("ipPhoneAdd")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ipPhoneAdd")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="employee_name">{t("ipPhoneEmployeeName")}</Label>
            <Input id="employee_name" {...register("employee_name", { required: true })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="extension_number">{t("ipPhoneExtensionNumber")}</Label>
            <Input id="extension_number" {...register("extension_number", { required: true })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("ipPhoneDeviceType")}</Label>
            <Select
              defaultValue="sip_app"
              onValueChange={(v) => setValue("device_type", v as IpPhoneDeviceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sip_app">{t("ipPhoneDeviceSipApp")}</SelectItem>
                <SelectItem value="hardware_phone">{t("ipPhoneDeviceHardware")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("ipPhoneMemo")}</Label>
            <Textarea id="memo" rows={2} {...register("memo")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("ipPhoneSaving") : t("ipPhoneSave")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteIpPhoneExtensionButton({ id }: { id: string }) {
  const t = useTranslations("activations");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("ipPhoneDeleteConfirm"))) return;
    setIsSubmitting(true);
    try {
      await deleteIpPhoneExtensionAction(id);
      toast.success(t("ipPhoneDeleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("ipPhoneDeleteError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isSubmitting}>
      {t("ipPhoneDelete")}
    </Button>
  );
}

export function IpPhoneSection({
  customerCode,
  extensions,
}: {
  customerCode: string;
  extensions: IpPhoneExtension[];
}) {
  const t = useTranslations("activations");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("ipPhoneTitle")}</CardTitle>
        <CardAction>
          <AddIpPhoneExtensionDialog customerCode={customerCode} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("ipPhoneEmployeeName")}</TableHead>
              <TableHead>{t("ipPhoneExtensionNumber")}</TableHead>
              <TableHead>{t("ipPhoneDeviceType")}</TableHead>
              <TableHead>{t("ipPhoneMemo")}</TableHead>
              <TableHead>{t("ipPhoneActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extensions.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.employee_name}</TableCell>
                <TableCell>{e.extension_number}</TableCell>
                <TableCell>
                  {e.device_type === "sip_app" ? t("ipPhoneDeviceSipApp") : t("ipPhoneDeviceHardware")}
                </TableCell>
                <TableCell className="whitespace-pre-wrap">{e.memo || "-"}</TableCell>
                <TableCell>
                  <DeleteIpPhoneExtensionButton id={e.id} />
                </TableCell>
              </TableRow>
            ))}
            {extensions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("ipPhoneEmpty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
