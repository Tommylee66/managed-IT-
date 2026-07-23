import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listAllIncidentLogs } from "@/lib/data-access/incident-logs";
import { listCustomers } from "@/lib/data-access/customers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateIncidentLogDialog } from "@/components/incident-logs/create-incident-log-dialog";

export default async function IncidentLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [logs, customers, t] = await Promise.all([
    listAllIncidentLogs(supabase),
    listCustomers(supabase, session!.role),
    getTranslations("incidentLogs"),
  ]);
  const customerName = (code: string) => customers.find((c) => c.code === code)?.name ?? code;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction className="flex gap-2">
          <Link href={`/${locale}/incident-logs/report`}>
            <Button variant="outline">{t("monthlyReportTitle")}</Button>
          </Link>
          <CreateIncidentLogDialog customers={customers} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("occurredDate")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("logTitle")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("engineer")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.occurred_date}</TableCell>
                <TableCell>{customerName(log.customer_code)}</TableCell>
                <TableCell>
                  <Badge variant={log.type === "incident" ? "destructive" : "secondary"}>
                    {log.type === "incident" ? t("typeIncident") : t("typeInspection")}
                  </Badge>
                </TableCell>
                <TableCell>{log.title}</TableCell>
                <TableCell className="max-w-md truncate">{log.description}</TableCell>
                <TableCell>{log.engineer || "-"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
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
