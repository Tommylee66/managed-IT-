import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listAllServiceLogs } from "@/lib/data-access/service-logs";
import { listCustomers } from "@/lib/data-access/customers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateServiceLogDialog } from "@/components/service-logs/create-service-log-dialog";

export default async function ServiceLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [logs, customers, t] = await Promise.all([
    listAllServiceLogs(supabase),
    listCustomers(supabase, session!.role),
    getTranslations("serviceLogs"),
  ]);
  const customerName = (code: string) => customers.find((c) => c.code === code)?.name ?? code;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction>
          <CreateServiceLogDialog customers={customers} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("logTitle")}</TableHead>
              <TableHead>{t("content")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.date}</TableCell>
                <TableCell>{customerName(log.customer_code)}</TableCell>
                <TableCell>{log.type}</TableCell>
                <TableCell>{log.title || "-"}</TableCell>
                <TableCell className="max-w-md truncate">{log.memo || "-"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
