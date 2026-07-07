import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listChangeRequests } from "@/lib/data-access/change-requests";
import { formatRupiah } from "@/lib/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChangeRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const [requests, t] = await Promise.all([
    listChangeRequests(supabase),
    getTranslations("changeRequests"),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("changeNo")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("contractNo")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("before")}</TableHead>
              <TableHead>{t("after")}</TableHead>
              <TableHead>{t("diff")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.no}>
                <TableCell>{r.no}</TableCell>
                <TableCell>
                  {r.contract_no ? (
                    <Link href={`/${locale}/contracts/${r.contract_no}`} className="hover:underline">
                      {r.customer_name}
                    </Link>
                  ) : (
                    r.customer_name
                  )}
                </TableCell>
                <TableCell>{r.contract_no}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{formatRupiah(r.old_monthly ?? 0)}</TableCell>
                <TableCell>{formatRupiah(r.new_monthly ?? 0)}</TableCell>
                <TableCell>{formatRupiah(r.diff ?? 0)}</TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
