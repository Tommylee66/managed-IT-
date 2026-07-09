import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { listProfiles } from "@/lib/data-access/profiles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalActions } from "@/components/admin/approval-actions";

export default async function AdminApprovalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [profiles, t] = await Promise.all([listProfiles(supabase), getTranslations("admin")]);

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers();
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

  const pendingProfiles = profiles.filter((p) => !p.is_approved);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("approvalsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPendingApprovals")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingProfiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{emailById.get(p.id) ?? "-"}</TableCell>
                  <TableCell>
                    <ApprovalActions userId={p.id} name={p.full_name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
