"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { convertApplicationToQuoteAction } from "@/app/[locale]/(dashboard)/applications/actions";

export function ConvertToQuoteButton({ applicationNo }: { applicationNo: string }) {
  const t = useTranslations("applications");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isConverting, setIsConverting] = useState(false);

  async function handleClick() {
    setIsConverting(true);
    try {
      const quoteNo = await convertApplicationToQuoteAction(applicationNo);
      toast.success(t("createQuoteSuccess"));
      router.push(`/${locale}/quotes/${quoteNo}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("createQuoteError"));
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isConverting}>
      {isConverting ? t("creatingQuote") : t("createQuote")}
    </Button>
  );
}
