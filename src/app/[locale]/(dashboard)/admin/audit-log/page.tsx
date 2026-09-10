import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ target_table?: string; target_id?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  let auditQuery = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.target_table) auditQuery = auditQuery.eq("target_table", filters.target_table);
  if (filters.target_id) auditQuery = auditQuery.eq("target_id", filters.target_id);

  const [{ data, error }, t] = await Promise.all([
    auditQuery,
    getTranslations("admin"),
  ]);
  if (error) throw error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auditLogTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("timestamp")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("target")}</TableHead>
              <TableHead>{t("actorRole")}</TableHead>
              <TableHead>{t("details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.created_at).toLocaleString(locale)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.action}</Badge>
                </TableCell>
                <TableCell>
                  {log.target_table}
                  {log.target_id ? ` / ${log.target_id}` : ""}
                </TableCell>
                <TableCell>{log.actor_role ?? "-"}</TableCell>
                <TableCell className="max-w-xl text-xs text-muted-foreground">
                  <details>
                    <summary className="cursor-pointer font-medium text-foreground">
                      {t("viewDetails")}
                    </summary>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("noAuditLogs")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
