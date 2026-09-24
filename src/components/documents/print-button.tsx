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

      // A blob URL belongs to the current document. Navigating this tab to the
      // blob unloads its owner, so Chrome's PDF viewer can display the file but
      // later fail to download it with "Check internet connection". Download
      // it while this document is still alive, then release the URL after the
      // browser has had enough time to copy the blob into its download task.
      const title = document.title
        .replace(/\.pdf$/i, "")
        .replace(/[<>:"/\\|?*]/g, "_")
        .trim();
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "BCT-document"}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error(t("pdfGenerationError"));
      window.print();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button className="print:hidden" onClick={handlePrint} disabled={isGenerating}>
      {isGenerating ? t("generatingPdf") : t("printSave")}
    </Button>
  );
}
