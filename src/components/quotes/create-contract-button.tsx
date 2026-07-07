"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createContractFromQuoteAction } from "@/app/[locale]/(dashboard)/contracts/actions";

export function CreateContractButton({ quoteNo, disabled }: { quoteNo: string; disabled?: boolean }) {
  const t = useTranslations("quotes");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isCreating, setIsCreating] = useState(false);

  async function handleClick() {
    setIsCreating(true);
    try {
      const contract = await createContractFromQuoteAction(quoteNo);
      toast.success(t("createContractSuccess"));
      router.push(`/${locale}/contracts/${contract.no}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("createContractError"));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || isCreating}>
      {isCreating ? t("creatingContract") : t("createContract")}
    </Button>
  );
}
