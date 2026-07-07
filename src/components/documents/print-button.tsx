"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("documents");
  return (
    <Button className="print:hidden" onClick={() => window.print()}>
      {t("printSave")}
    </Button>
  );
}
