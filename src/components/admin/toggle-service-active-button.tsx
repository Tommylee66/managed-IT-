"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setServiceCatalogActiveAction } from "@/app/[locale]/(dashboard)/admin/rates/actions";

export function ToggleServiceActiveButton({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      await setServiceCatalogActiveAction(id, !active);
      toast.success(active ? t("deactivateSuccess") : t("activateSuccess"));
      router.refresh();
    } catch {
      toast.error(t("toggleError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isSubmitting}>
      {active ? t("deactivate") : t("activate")}
    </Button>
  );
}
