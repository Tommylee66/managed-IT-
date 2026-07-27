"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer } from "@/types/domain";

export function CustomerLookupPicker({
  customers,
  selectedCode,
}: {
  customers: Customer[];
  selectedCode?: string;
}) {
  const t = useTranslations("activations");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  function onSelect(code: string) {
    router.push(`/${locale}/activations?customer=${code}`);
  }

  return (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label>{t("lookupSelectCustomer")}</Label>
      <Select value={selectedCode} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder={t("select")} />
        </SelectTrigger>
        <SelectContent>
          {customers.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} - {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
