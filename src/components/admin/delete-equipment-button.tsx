"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteEquipmentCatalogItemAction } from "@/app/[locale]/(dashboard)/admin/rates/actions";

export function DeleteEquipmentButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (!window.confirm(t("equipmentDeleteConfirm", { name }))) return;
    setIsSubmitting(true);
    try {
      await deleteEquipmentCatalogItemAction(id);
      toast.success(t("equipmentDeleteSuccess"));
      router.refresh();
    } catch (e) {
      const inUse = e instanceof Error && e.message.includes("EQUIPMENT_IN_USE");
      toast.error(inUse ? t("equipmentDeleteInUseError") : t("equipmentDeleteError"));
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
