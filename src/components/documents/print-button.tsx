"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("documents");
  const pathname = usePathname();

  function handlePrint() {
    const path = `${pathname}${window.location.search}`;

    // Keep the export audit trail, but let the browser create the PDF locally.
    // Sending a multi-megabyte Chromium PDF through a serverless response made
    // Chrome's download manager intermittently report a network error. The
    // native print dialog has a built-in "Save as PDF" destination and avoids
    // that transfer entirely. `keepalive` lets the small audit request finish
    // while the modal print dialog is open.
    void fetch("/api/documents/pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {
      // Printing must remain available even if audit logging is temporarily
      // unavailable; the server also reports the failure in its own logs.
    });

    window.print();
  }

  return (
    <Button className="print:hidden" onClick={handlePrint}>
      {t("printSave")}
    </Button>
  );
}
