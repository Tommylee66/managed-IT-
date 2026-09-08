"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/currency";
import { billableOverage, includedAllowance, isColorTiered } from "@/lib/calc/equipment-pricing";
import type { EquipmentCatalogItem } from "@/types/domain";
import type { Locale } from "@/config/constants";

export interface EquipmentSelectionState {
  qty: number;
  overageQty: number;
  colorOverageQty: number;
}

/** Shared by the quote calculator and the change-request form — both let
 * staff pick priced/informational catalog items with a quantity, plus a
 * usage count for items with an overage rate (e.g. printer pages). Usage is
 * entered raw (the meter reading), not net of the item's included
 * allowance: the allowance is subtracted here and by equipmentPricedRows,
 * from the same helpers, so what staff see previewed is what gets billed. */
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
  const tCommon = useTranslations("common");

  function toggle(id: string, checked: boolean) {
    const next = { ...value };
    if (checked) next[id] = next[id] ?? { qty: 1, overageQty: 0, colorOverageQty: 0 };
    else delete next[id];
    onChange(next);
  }

  function update(id: string, patch: Partial<EquipmentSelectionState>) {
    const current = value[id] ?? { qty: 1, overageQty: 0, colorOverageQty: 0 };
    onChange({ ...value, [id]: { ...current, ...patch } });
  }

  /** One usage row: the rate for this tier, the raw usage input, and what
   * the allowance leaves billable. */
  function usageRow(
    item: EquipmentCatalogItem,
    labelKey: "equipmentUsageLabel" | "equipmentMonoUsageLabel" | "equipmentColorUsageLabel",
    rate: number,
    includedQty: number | null,
    usedQty: number,
    onUsedChange: (n: number) => void
  ) {
    const qty = value[item.id]?.qty ?? 1;
    const allowance = includedAllowance(includedQty ?? 0, qty);
    const billable = billableOverage(usedQty, includedQty ?? 0, qty);
    return (
      <div className="ml-7 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {tQuotes(labelKey, { rate: formatRupiah(rate, locale) })}
        </span>
        <Input
          type="number"
          min={0}
          className="w-24"
          value={usedQty}
          onChange={(e) => onUsedChange(Number(e.target.value))}
        />
        {allowance > 0 && (
          <span className="text-xs text-muted-foreground">
            {tQuotes("equipmentIncludedNote", { included: allowance, billable })}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {catalog
        .filter((item) => item.is_active || item.id in value)
        .map((item) => {
        const checked = item.id in value;
        const colorTiered = isColorTiered(item.color_overage_rate, item.color_included_qty);
        return (
          <div key={item.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
              <span className="flex-1 text-sm">
                <span className="text-muted-foreground">[{tCat(item.category)}]</span> {item.model_name}
                {!item.is_active && (
                  <span className="text-destructive"> ({tQuotes("catalogItemInactive")})</span>
                )}
                {item.spec && (
                  <span className="text-muted-foreground"> — {item.spec}</span>
                )}
                {item.monthly_rate != null && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({formatRupiah(item.monthly_rate, locale)}/{tCommon("perMonth")})
                  </span>
                )}
              </span>
              <Input
                type="number"
                min={1}
                className="w-20"
                disabled={!checked}
                value={value[item.id]?.qty ?? 1}
                onChange={(e) => update(item.id, { qty: Number(e.target.value) })}
              />
            </div>
            {checked && item.overage_rate != null &&
              usageRow(
                item,
                colorTiered ? "equipmentMonoUsageLabel" : "equipmentUsageLabel",
                item.overage_rate,
                item.included_qty,
                value[item.id]?.overageQty ?? 0,
                (n) => update(item.id, { overageQty: n })
              )}
            {checked && colorTiered && item.color_overage_rate != null &&
              usageRow(
                item,
                "equipmentColorUsageLabel",
                item.color_overage_rate,
                item.color_included_qty,
                value[item.id]?.colorOverageQty ?? 0,
                (n) => update(item.id, { colorOverageQty: n })
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
    colorOverageQty: s.colorOverageQty,
  }));
}
