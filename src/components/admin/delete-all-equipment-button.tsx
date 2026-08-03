"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteAllUnusedEquipmentCatalogItemsAction } from "@/app/[locale]/(dashboard)/admin/rates/actions";

export function DeleteAllEquipmentButton({ count }: { count: number }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (count === 0) return;
    const typed = window.prompt(t("equipmentDeleteAllConfirmPrompt", { count }));
    if (typed === null) return;
    if (typed.trim() !== String(count)) {
      toast.error(t("equipmentDeleteAllConfirmMismatch"));
      return;
    }
    setIsSubmitting(true);
    try {
      const { deletedCount, skippedCount } = await deleteAllUnusedEquipmentCatalogItemsAction();
      if (skippedCount > 0) {
        toast.success(t("equipmentDeleteAllSuccessWithSkipped", { deletedCount, skippedCount }));
      } else {
        toast.success(t("equipmentDeleteAllSuccess", { deletedCount }));
      }
      router.refresh();
    } catch {
      toast.error(t("equipmentDeleteAllError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick} disabled={isSubmitting || count === 0}>
      {t("equipmentDeleteAll")}
    </Button>
  );
}
