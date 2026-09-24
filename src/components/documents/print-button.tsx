"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("documents");
  const pathname = usePathname();

  function handlePrint() {
    const path = `${pathname}${window.location.search}`;
    const link = document.createElement("a");

    // Download from the real HTTPS endpoint. Blob/object URLs are handled as
    // temporary in-memory resources by some browsers and download managers;
    // they can display the PDF but later report "Check internet connection"
    // when saving it. The API responds with Content-Disposition: attachment,
    // so this request remains a normal authenticated file download.
    link.href = `/api/documents/pdf?path=${encodeURIComponent(path)}`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <Button className="print:hidden" onClick={handlePrint}>
      {t("printSave")}
    </Button>
  );
}
