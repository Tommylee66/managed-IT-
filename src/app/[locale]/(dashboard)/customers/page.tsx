import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/data-access/customers";
import { listAgents } from "@/lib/data-access/agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [customers, agents, t] = await Promise.all([
    listCustomers(supabase, session!.role),
    listAgents(supabase, session!.role),
    getTranslations("customers"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    draft: t("statusDraft"),
    contracted: t("statusContracted"),
    activated: t("statusActivated"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardAction>
          <CreateCustomerDialog agents={agents} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("contact")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.code}>
                <TableCell>
                  <Link href={`/${locale}/customers/${c.code}`} className="font-medium hover:underline">
                    {c.code}
                  </Link>
                </TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.contact || "-"}</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "activated" ? "default" : "secondary"}>
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
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
