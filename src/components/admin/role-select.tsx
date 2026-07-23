"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StaffRole } from "@/types/domain";

const ROLES: StaffRole[] = ["admin_dept", "activation_dept", "sales_agent", "master"];

export function RoleSelect({ userId, role, disabled }: { userId: string; role: StaffRole; disabled?: boolean }) {
  const t = useTranslations("admin");
  const tRoles = useTranslations("roles");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChange(newRole: StaffRole) {
    if (newRole === role) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("roleChangeError"));
        return;
      }
      toast.success(t("roleChangeSuccess"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Select value={role} onValueChange={(v) => handleChange(v as StaffRole)} disabled={disabled || isSubmitting}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {tRoles(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
