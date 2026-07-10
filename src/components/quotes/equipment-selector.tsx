"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/currency";
import type { EquipmentCatalogItem } from "@/types/domain";

/** Shared by the quote calculator and the change-request form — both let
 * staff pick priced/informational catalog items with a quantity. */
export function EquipmentSelector({
  catalog,
  value,
  onChange,
}: {
  catalog: EquipmentCatalogItem[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  const tCat = useTranslations("equipmentCategory");

  function toggle(id: string, checked: boolean) {
    const next = { ...value };
    if (checked) next[id] = next[id] ?? 1;
    else delete next[id];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {catalog.map((item) => {
        const checked = item.id in value;
        return (
          <div key={item.id} className="flex items-center gap-3">
            <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
            <span className="flex-1 text-sm">
              <span className="text-muted-foreground">[{tCat(item.category)}]</span> {item.model_name}
              {item.spec_id && <span className="text-muted-foreground"> — {item.spec_id}</span>}
              {item.monthly_rate != null && (
                <span className="text-muted-foreground"> ({formatRupiah(item.monthly_rate)}/월)</span>
              )}
            </span>
            <Input
              type="number"
              min={1}
              className="w-20"
              disabled={!checked}
              value={value[item.id] ?? 1}
              onChange={(e) => onChange({ ...value, [item.id]: Number(e.target.value) })}
            />
          </div>
        );
      })}
    </div>
  );
}

export function equipmentQtyToRequest(qty: Record<string, number>) {
  return Object.entries(qty).map(([catalogId, q]) => ({ catalogId, qty: q }));
}
