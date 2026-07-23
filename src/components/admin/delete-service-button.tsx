"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteServiceCatalogItemAction } from "@/app/[locale]/(dashboard)/admin/rates/actions";

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("serviceDeleteConfirm", { name }))) return;
    setIsSubmitting(true);
    try {
      await deleteServiceCatalogItemAction(id);
      toast.success(t("serviceDeleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("serviceDeleteError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isSubmitting}>
      {t("delete")}
    </Button>
  );
}
