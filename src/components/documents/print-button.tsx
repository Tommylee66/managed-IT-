"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("documents");
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handlePrint() {
    setIsGenerating(true);
    try {
      const path = `${pathname}${window.location.search}`;
      const res = await fetch(`/api/documents/pdf?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Navigate the current tab (instead of window.open) so this never
      // depends on a popup blocker's user-activation heuristics — the browser's
      // built-in PDF viewer opens in-place with its own print/download controls.
      window.location.href = url;
    } catch {
      toast.error(t("pdfGenerationError"));
      window.print();
      setIsGenerating(false);
    }
  }

  return (
    <Button className="print:hidden" onClick={handlePrint} disabled={isGenerating}>
      {isGenerating ? t("generatingPdf") : t("printSave")}
    </Button>
  );
}
