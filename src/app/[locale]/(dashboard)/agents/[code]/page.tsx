import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getAgent } from "@/lib/data-access/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AgentDetailActions } from "@/components/agents/agent-detail-actions";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const { code, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const agent = await getAgent(supabase, code, session!.role);
  if (!agent) notFound();

  const [t, tCommon] = await Promise.all([
    getTranslations("agents"),
    getTranslations("common"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{agent.name}</h1>
        <Badge variant={agent.active ? "default" : "secondary"}>
          {agent.active ? tCommon("active") : tCommon("inactive")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("code")}</p>
            <p>{agent.code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("currentRate")}</p>
            <p>{agent.rate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("phone")}</p>
            <p>{agent.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("bankAccount")}</p>
            <p>
              {agent.bank?.bankName
                ? `${agent.bank.bankName} ${agent.bank.accountNumber ?? ""} (${agent.bank.holderName ?? ""})`
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("rateHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("effectiveDate")}</TableHead>
                <TableHead>{t("rate")}</TableHead>
                <TableHead>{t("recordedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>{h.date}</TableCell>
                  <TableCell>{h.rate}%</TableCell>
                  <TableCell>{new Date(h.recordedAt).toLocaleString(locale)}</TableCell>
                </TableRow>
              ))}
              {agent.history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t("noHistory")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {session!.role === "master" && <AgentDetailActions code={agent.code} active={agent.active} />}
    </div>
  );
}
