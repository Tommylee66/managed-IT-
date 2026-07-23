"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/currency";
import type { EquipmentCatalogItem } from "@/types/domain";
import type { Locale } from "@/config/constants";

export interface EquipmentSelectionState {
  qty: number;
  overageQty: number;
}

/** Shared by the quote calculator and the change-request form — both let
 * staff pick priced/informational catalog items with a quantity, plus an
 * extra-usage count for items with an overage rate (e.g. printer pages). */
export function EquipmentSelector({
  catalog,
  value,
  onChange,
  locale,
}: {
  catalog: EquipmentCatalogItem[];
  value: Record<string, EquipmentSelectionState>;
  onChange: (next: Record<string, EquipmentSelectionState>) => void;
  locale: Locale;
}) {
  const tCat = useTranslations("equipmentCategory");
  const tQuotes = useTranslations("quotes");

  function toggle(id: string, checked: boolean) {
    const next = { ...value };
    if (checked) next[id] = next[id] ?? { qty: 1, overageQty: 0 };
    else delete next[id];
    onChange(next);
  }

  function updateQty(id: string, qty: number) {
    onChange({ ...value, [id]: { qty, overageQty: value[id]?.overageQty ?? 0 } });
  }

  function updateOverageQty(id: string, overageQty: number) {
    onChange({ ...value, [id]: { qty: value[id]?.qty ?? 1, overageQty } });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {catalog.map((item) => {
        const checked = item.id in value;
        return (
          <div key={item.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
              <span className="flex-1 text-sm">
                <span className="text-muted-foreground">[{tCat(item.category)}]</span> {item.model_name}
                {item.spec_id && <span className="text-muted-foreground"> — {item.spec_id}</span>}
                {item.monthly_rate != null && (
                  <span className="text-muted-foreground"> ({formatRupiah(item.monthly_rate, locale)}/월)</span>
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
            {checked && item.overage_rate != null && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {tQuotes("equipmentOverageQtyLabel", { rate: formatRupiah(item.overage_rate, locale) })}
                </span>
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  value={value[item.id]?.overageQty ?? 0}
                  onChange={(e) => updateOverageQty(item.id, Number(e.target.value))}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function equipmentQtyToRequest(value: Record<string, EquipmentSelectionState>) {
  return Object.entries(value).map(([catalogId, s]) => ({
    catalogId,
    qty: s.qty,
    overageQty: s.overageQty,
  }));
}
