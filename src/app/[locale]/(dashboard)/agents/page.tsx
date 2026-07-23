import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listAgents } from "@/lib/data-access/agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [agents, t, tCommon] = await Promise.all([
    listAgents(supabase, session!.role),
    getTranslations("agents"),
    getTranslations("common"),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction className="flex gap-2">
          {session!.role === "master" && (
            <Link href={`/${locale}/agents/commission`}>
              <Button variant="outline">{t("commissionReportTitle")}</Button>
            </Link>
          )}
          <CreateAgentDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("commissionRate")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("bankAccount")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.code}>
                <TableCell>
                  <Link href={`/${locale}/agents/${agent.code}`} className="font-medium hover:underline">
                    {agent.code}
                  </Link>
                </TableCell>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.rate}%</TableCell>
                <TableCell>{agent.phone || "-"}</TableCell>
                <TableCell>
                  {agent.bank?.bankName
                    ? `${agent.bank.bankName} ${agent.bank.accountNumber ?? ""}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={agent.active ? "default" : "secondary"}>
                    {agent.active ? tCommon("active") : tCommon("inactive")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
