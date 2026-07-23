"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryBox } from "@/components/ui/summary-box";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils/currency";
import {
  calcAssetDecision,
  summarizeTerminationPlan,
  contractElapsedMonths,
  contractRemainingMonths,
  isNonRecoverable,
  isConfigAsset,
  type AssetDecisionInput,
} from "@/lib/calc/termination-calc";
import { createTerminationPlanAction } from "@/app/[locale]/(dashboard)/termination/actions";
import type { Contract, Asset } from "@/types/domain";
import type { Locale } from "@/config/constants";

interface RowState extends AssetDecisionInput {
  assetType: Asset["type"];
  assetOwner: Asset["owner"];
}

export function TerminationForm({
  contract,
  assets,
  defaultCosts,
}: {
  contract: Contract;
  assets: Asset[];
  defaultCosts: Record<string, number>;
}) {
  const t = useTranslations("termination");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [termDate, setTermDate] = useState(new Date().toISOString().slice(0, 10));
  const [penaltyRate, setPenaltyRate] = useState(50);
  const [adminFee, setAdminFee] = useState(1_500_000);
  const [unpaid, setUnpaid] = useState(0);
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ACTION_LABEL: Record<string, string> = {
    remain_customer: t("actionRemainCustomer"),
    close_config: t("actionCloseConfig"),
    collect: t("actionCollect"),
    leave_bill: t("actionLeaveBill"),
    partial: t("actionPartial"),
  };

  const [rows, setRows] = useState<RowState[]>(() =>
    assets.map((a, i) => {
      const key = a.asset_id || `${a.contract_no}|${a.type}|${a.owner}|${a.name}|${i}`;
      const total = a.qty || 1;
      const nonRecoverable = isNonRecoverable(a.owner, a.type);
      const configAsset = isConfigAsset(a.type);
      return {
        key,
        assetId: a.asset_id,
        type: a.type,
        assetType: a.type,
        owner: a.owner,
        assetOwner: a.owner,
        name: a.name ?? "",
        model: a.model ?? "",
        serial: a.serial ?? "",
        qty: total,
        location: a.location ?? "",
        originalCost: defaultCosts[a.id] ?? 0,
        collectQty: nonRecoverable || configAsset ? 0 : total,
        billQty: 0,
      };
    })
  );

  const elapsed = contractElapsedMonths(contract.start_date, termDate, contract.months);
  const remaining = contractRemainingMonths(contract.start_date, termDate, contract.months);

  const decisions = useMemo(
    () => rows.map((r) => calcAssetDecision(r, remaining, contract.months)),
    [rows, remaining, contract.months]
  );
  const summary = useMemo(
    () => summarizeTerminationPlan(decisions, penaltyRate, adminFee, unpaid),
    [decisions, penaltyRate, adminFee, unpaid]
  );

  function updateRow(i: number, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const plan = await createTerminationPlanAction({
        contract_no: contract.no,
        customer_code: contract.customer_code,
        customer_name: contract.customer_name,
        term_date: termDate,
        remaining,
        penalty_rate: penaltyRate,
        admin_fee: adminFee,
        unpaid,
        memo,
        asset_decisions: decisions,
      });
      toast.success(t("saveSuccess"));
      router.push(`/${locale}/termination/${plan.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("conditions")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>{t("terminationDate")}</Label>
            <Input type="date" value={termDate} onChange={(e) => setTermDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("penaltyRate")}</Label>
            <Input
              type="number"
              value={penaltyRate}
              onChange={(e) => setPenaltyRate(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("adminFee")}</Label>
            <Input type="number" value={adminFee} onChange={(e) => setAdminFee(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("unpaidFee")}</Label>
            <Input type="number" value={unpaid} onChange={(e) => setUnpaid(Number(e.target.value))} />
          </div>
          <div className="col-span-2 md:col-span-4 flex flex-col gap-2">
            <Label>{t("notes")}</Label>
            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <div className="col-span-2 md:col-span-4 text-sm text-muted-foreground">
            {t("elapsedRemaining", { elapsed, remaining, months: contract.months })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("assetProcessing")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("equipmentName")}</TableHead>
                <TableHead>{t("totalQty")}</TableHead>
                <TableHead>{t("collectQty")}</TableHead>
                <TableHead>{t("remainingQty")}</TableHead>
                <TableHead>{t("unitCost")}</TableHead>
                <TableHead className="text-right">{t("unamortizedAmount")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const decision = decisions[i];
                const disabled = isNonRecoverable(row.owner, row.type) || isConfigAsset(row.type);
                return (
                  <TableRow key={row.key}>
                    <TableCell>
                      {row.name}
                      <br />
                      <span className="text-xs text-muted-foreground">{row.assetId}</span>
                    </TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        min={0}
                        max={row.qty}
                        disabled={disabled}
                        value={row.collectQty}
                        onChange={(e) => updateRow(i, { collectQty: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        min={0}
                        max={row.qty}
                        disabled={disabled}
                        value={row.billQty}
                        onChange={(e) => updateRow(i, { billQty: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-32"
                        value={row.originalCost}
                        onChange={(e) => updateRow(i, { originalCost: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(decision.unamortized, locale as Locale)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ACTION_LABEL[decision.action]}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("noAssets")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryBox
            label={t("estimatedTotal")}
            value={formatRupiah(summary.total, locale as Locale)}
            metrics={[
              { label: t("collectedEquipment"), value: t("qtyUnit", { count: summary.collectQtyTotal }) },
              { label: t("remainingEquipment"), value: t("qtyUnit", { count: summary.leaveQtyTotal }) },
              { label: t("unamortizedSettlement"), value: formatRupiah(summary.unamortizedTotal, locale as Locale) },
              { label: t("earlyTerminationPenalty", { rate: penaltyRate }), value: formatRupiah(summary.penalty, locale as Locale) },
              { label: t("removalAdminFee"), value: formatRupiah(adminFee, locale as Locale) },
              { label: t("unpaidFeeLabel"), value: formatRupiah(unpaid, locale as Locale) },
            ]}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSubmitting} className="w-fit">
        {isSubmitting ? t("saving") : t("saveRequest")}
      </Button>
    </div>
  );
}
