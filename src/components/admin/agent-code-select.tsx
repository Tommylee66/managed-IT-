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
import type { Agent } from "@/types/domain";

const UNLINKED = "__unlinked__";

export function AgentCodeSelect({
  userId,
  agentCode,
  agents,
  disabled,
}: {
  userId: string;
  agentCode: string | null;
  agents: Agent[];
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (disabled) return <span className="text-sm text-muted-foreground">-</span>;

  async function handleChange(value: string) {
    const newAgentCode = value === UNLINKED ? null : value;
    if (newAgentCode === agentCode) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/agent-code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_code: newAgentCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          body.error === "NOT_SALES_AGENT" ? t("agentLinkErrorNotSalesAgent") : t("agentLinkError");
        toast.error(message);
        return;
      }
      toast.success(t("agentLinkSuccess"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Select value={agentCode ?? UNLINKED} onValueChange={handleChange} disabled={isSubmitting}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNLINKED}>{t("noAgentLinked")}</SelectItem>
        {agents.map((a) => (
          <SelectItem key={a.code} value={a.code}>
            {a.code} - {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
