"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/currency";
import type { ServiceCatalogItem } from "@/types/domain";
import type { Locale } from "@/config/constants";

export interface ServiceSelectionState {
  qty: number;
}

/** Shared by the quote calculator and the change-request form — staff pick
 * master-defined additional service items (VPN, priority response, security
 * monitoring, etc.) with a quantity, same interaction as EquipmentSelector. */
export function ServiceSelector({
  catalog,
  value,
  onChange,
  locale,
}: {
  catalog: ServiceCatalogItem[];
  value: Record<string, ServiceSelectionState>;
  onChange: (next: Record<string, ServiceSelectionState>) => void;
  locale: Locale;
}) {
  const t = useTranslations("common");

  function toggle(id: string, checked: boolean) {
    const next = { ...value };
    if (checked) next[id] = next[id] ?? { qty: 1 };
    else delete next[id];
    onChange(next);
  }

  function updateQty(id: string, qty: number) {
    onChange({ ...value, [id]: { qty } });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {catalog.map((item) => {
        const checked = item.id in value;
        return (
          <div key={item.id} className="flex items-center gap-3">
            <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
            <span className="flex-1 text-sm">
              {locale === "ko" ? item.name_ko : item.name_id}
              {(locale === "ko" ? item.description_ko : item.description_id) && (
                <span className="text-muted-foreground">
                  {" "}
                  — {locale === "ko" ? item.description_ko : item.description_id}
                </span>
              )}
              {item.monthly_rate != null && (
                <span className="text-muted-foreground">
                  {" "}
                  ({formatRupiah(item.monthly_rate, locale)}/{t("perMonth")})
                </span>
              )}
            </span>
            <Input
              type="number"
              min={1}
              className="w-20"
              disabled={!checked}
              value={value[item.id]?.qty ?? 1}
              onChange={(e) => updateQty(item.id, Number(e.target.value))}
            />
          </div>
        );
      })}
    </div>
  );
}

export function serviceQtyToRequest(value: Record<string, ServiceSelectionState>) {
  return Object.entries(value).map(([catalogId, s]) => ({
    catalogId,
    qty: s.qty,
  }));
}
