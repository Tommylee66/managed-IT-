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
  createServiceCredentialAction,
  deleteServiceCredentialAction,
  revealServiceCredentialPasswordAction,
} from "@/app/[locale]/(dashboard)/activations/[id]/actions";
import type { ServiceCredential, ServiceCredentialCategory } from "@/types/domain";

interface FormValues {
  service_name: string;
  category: ServiceCredentialCategory;
  login_id: string;
  password: string;
  url: string;
  memo: string;
}

function AddServiceCredentialDialog({ customerCode }: { customerCode: string }) {
  const t = useTranslations("activations");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { category: "other" } });

  async function onSubmit(values: FormValues) {
    try {
      await createServiceCredentialAction({
        customer_code: customerCode,
        service_name: values.service_name,
        category: values.category,
        login_id: values.login_id || null,
        password: values.password || null,
        url: values.url || null,
        memo: values.memo || null,
      });
      toast.success(t("credentialSaveSuccess"));
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(`${t("credentialSaveError")}${e instanceof Error ? ` (${e.message})` : ""}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("credentialAdd")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("credentialAdd")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="service_name">{t("credentialServiceName")}</Label>
            <Input id="service_name" {...register("service_name", { required: true })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("credentialCategory")}</Label>
            <Select
              defaultValue="other"
              onValueChange={(v) => setValue("category", v as ServiceCredentialCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud_storage">{t("credentialCategoryCloudStorage")}</SelectItem>
                <SelectItem value="web_hosting">{t("credentialCategoryWebHosting")}</SelectItem>
                <SelectItem value="device_access">{t("credentialCategoryDeviceAccess")}</SelectItem>
                <SelectItem value="other">{t("credentialCategoryOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login_id">{t("credentialLoginId")}</Label>
              <Input id="login_id" {...register("login_id")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("credentialPassword")}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">{t("credentialUrl")}</Label>
            <Input id="url" {...register("url")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="memo">{t("credentialMemo")}</Label>
            <Textarea id="memo" rows={2} {...register("memo")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("credentialSaving") : t("credentialSave")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteServiceCredentialButton({ id }: { id: string }) {
  const t = useTranslations("activations");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("credentialDeleteConfirm"))) return;
    setIsSubmitting(true);
    try {
      await deleteServiceCredentialAction(id);
      toast.success(t("credentialDeleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("credentialDeleteError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isSubmitting}>
      {t("credentialDelete")}
    </Button>
  );
}

function PasswordCell({ id, hasPassword }: { id: string; hasPassword: boolean }) {
  const t = useTranslations("activations");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!hasPassword) return <span className="text-muted-foreground">-</span>;

  async function handleToggle() {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    try {
      const password = await revealServiceCredentialPasswordAction(id);
      setRevealed(password ?? "");
    } catch (e) {
      toast.error(`${t("credentialRevealError")}${e instanceof Error ? ` (${e.message})` : ""}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">{revealed !== null ? revealed : "••••••••"}</span>
      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={loading}>
        {revealed !== null ? t("credentialHide") : t("credentialReveal")}
      </Button>
    </div>
  );
}

export function ServiceCredentialSection({
  customerCode,
  credentials,
}: {
  customerCode: string;
  credentials: ServiceCredential[];
}) {
  const t = useTranslations("activations");
  const CATEGORY_LABEL: Record<ServiceCredentialCategory, string> = {
    cloud_storage: t("credentialCategoryCloudStorage"),
    web_hosting: t("credentialCategoryWebHosting"),
    device_access: t("credentialCategoryDeviceAccess"),
    other: t("credentialCategoryOther"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("credentialTitle")}</CardTitle>
        <CardAction>
          <AddServiceCredentialDialog customerCode={customerCode} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("credentialServiceName")}</TableHead>
              <TableHead>{t("credentialCategory")}</TableHead>
              <TableHead>{t("credentialLoginId")}</TableHead>
              <TableHead>{t("credentialPassword")}</TableHead>
              <TableHead>{t("credentialUrl")}</TableHead>
              <TableHead>{t("credentialActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.service_name}</TableCell>
                <TableCell>{CATEGORY_LABEL[c.category]}</TableCell>
                <TableCell>{c.login_id || "-"}</TableCell>
                <TableCell>
                  <PasswordCell id={c.id} hasPassword={c.has_password} />
                </TableCell>
                <TableCell className="max-w-48 truncate">{c.url || "-"}</TableCell>
                <TableCell>
                  <DeleteServiceCredentialButton id={c.id} />
                </TableCell>
              </TableRow>
            ))}
            {credentials.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("credentialEmpty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
