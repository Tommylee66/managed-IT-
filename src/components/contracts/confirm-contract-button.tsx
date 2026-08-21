"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { confirmContractAction } from "@/app/[locale]/(dashboard)/contracts/actions";

export function ConfirmContractButton({ contractNo }: { contractNo: string }) {
  const t = useTranslations("contracts");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      await confirmContractAction(contractNo);
      toast.success(t("confirmContractSuccess"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("confirmContractError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? t("confirming") : t("confirmContract")}
    </Button>
  );
}
