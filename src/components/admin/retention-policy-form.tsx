"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  updateRetentionPolicyAction,
  purgeExpiredPersonalDataAction,
} from "@/app/[locale]/(dashboard)/admin/retention/actions";
import type { RetentionKey, RetentionPreview } from "@/types/domain";

/** Rows carry the counts a purge would touch right now, so the operator
 * decides against real numbers rather than against the period alone. */
export function RetentionPolicyForm({ policies }: { policies: RetentionPreview[] }) {
  const t = useTranslations("retention");
  const [draft, setDraft] = useState<Record<string, { months: number; enabled: boolean }>>(
    Object.fromEntries(policies.map((p) => [p.key, { months: p.months, enabled: p.enabled }]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  async function save(key: RetentionKey) {
    setSavingKey(key);
    try {
      await updateRetentionPolicyAction(key, draft[key]);
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSavingKey(null);
    }
  }

  async function purge() {
    setIsPurging(true);
    try {
      const result = await purgeExpiredPersonalDataAction();
      const total = Object.values(result).reduce((s, n) => s + Number(n), 0);
      toast.success(t("purgeSuccess", { count: total }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("purgeError"));
    } finally {
      setIsPurging(false);
    }
  }

  const enabledTotal = policies
    .filter((p) => draft[p.key]?.enabled)
    .reduce((s, p) => s + p.affected, 0);

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("anchor")}</TableHead>
            <TableHead className="w-32">{t("months")}</TableHead>
            <TableHead className="w-28">{t("affected")}</TableHead>
            <TableHead className="w-24">{t("enabled")}</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((p) => (
            <TableRow key={p.key}>
              <TableCell className="font-medium">{t(`key.${p.key}`)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t(`anchorText.${p.key}`)}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  value={draft[p.key]?.months ?? 0}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [p.key]: { ...d[p.key], months: Number(e.target.value) },
                    }))
                  }
                />
              </TableCell>
              <TableCell>
                {/* Counted with the period stored in the database, not the
                    one being typed — it only refreshes once saved. */}
                {p.affected > 0 ? (
                  <Badge variant="destructive">{p.affected}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={draft[p.key]?.enabled ?? false}
                  onCheckedChange={(v) =>
                    setDraft((d) => ({ ...d, [p.key]: { ...d[p.key], enabled: v === true } }))
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingKey === p.key}
                  onClick={() => save(p.key)}
                >
                  {t("save")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-fit" disabled={enabledTotal === 0}>
            {t("purge")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("purgeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("purgeConfirmBody", { count: enabledTotal })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={isPurging} onClick={purge}>
              {t("purge")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
