import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { listProfiles } from "@/lib/data-access/profiles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateStaffDialog } from "@/components/admin/create-staff-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { ToggleActiveButton } from "@/components/admin/toggle-active-button";

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [profiles, t, tRoles] = await Promise.all([
    listProfiles(supabase),
    getTranslations("admin"),
    getTranslations("roles"),
  ]);
  const approvedProfiles = profiles.filter((p) => p.is_approved);

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers();
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("staffTitle")}</CardTitle>
        <CardAction>
          <CreateStaffDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvedProfiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.full_name}</TableCell>
                <TableCell>{emailById.get(p.id) ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={p.role === "master" ? "default" : "secondary"}>{tRoles(p.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <ResetPasswordDialog userId={p.id} name={p.full_name} />
                  <ToggleActiveButton
                    userId={p.id}
                    active={p.is_active}
                    disabled={p.id === session.userId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
