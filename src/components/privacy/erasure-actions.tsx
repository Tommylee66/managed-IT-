"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  type: "agent" | "customer";
  code: string;
  /** Already anonymised — the action is spent, so only the export stays. */
  anonymized?: boolean;
  onAnonymize: (code: string) => Promise<void>;
}

/**
 * The two data-subject rights that need an operator to act: erasure and
 * portability (UU PDP art. 8 and 13). Master-only, and the page it sits on
 * is master-only too — this is the visible half, the enforcement is in
 * Postgres (see 20260920000002_personal_data_erasure.sql).
 */
export function ErasureActions({ type, code, anonymized, onAnonymize }: Props) {
  const t = useTranslations("privacy");
  const [confirmText, setConfirmText] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  async function handleAnonymize() {
    setIsRunning(true);
    try {
      await onAnonymize(code);
      toast.success(t("anonymizeSuccess"));
    } catch (error) {
      // The RPC refuses while a contract is still in force, and that is the
      // failure an operator will actually hit — show its reason rather than
      // a generic error, or they cannot tell it from a bug.
      toast.error(error instanceof Error ? error.message : t("anonymizeError"));
    } finally {
      setIsRunning(false);
      setConfirmText("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">{t("description")}</p>

        <Button variant="outline" asChild>
          <a href={`/api/privacy/export?type=${type}&code=${encodeURIComponent(code)}`}>
            {t("export")}
          </a>
        </Button>

        {!anonymized && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">{t("anonymize")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("anonymizeConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("anonymizeConfirmBody", { code })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {/* Typing the code is the brake: this cannot be undone, and the
                  dialog is one click away from a page the operator is already
                  reading. */}
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={code}
                aria-label={t("anonymizeConfirmPrompt", { code })}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmText !== code || isRunning}
                  onClick={handleAnonymize}
                >
                  {t("anonymize")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
