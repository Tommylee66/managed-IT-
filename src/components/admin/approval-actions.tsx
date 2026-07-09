"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ userId, name }: { userId: string; name: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/approve`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("approveError"));
        return;
      }
      toast.success(t("approveSuccess"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!window.confirm(t("rejectConfirm", { name }))) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/reject`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("rejectError"));
        return;
      }
      toast.success(t("rejectSuccess"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="green" size="sm" onClick={handleApprove} disabled={isSubmitting}>
        {t("approve")}
      </Button>
      <Button variant="destructive" size="sm" onClick={handleReject} disabled={isSubmitting}>
        {t("reject")}
      </Button>
    </div>
  );
}
