import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listAllAssets } from "@/lib/data-access/assets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [assets, t, tContracts, tCommon] = await Promise.all([
    listAllAssets(supabase, session!.role),
    getTranslations("assets"),
    getTranslations("contracts"),
    getTranslations("common"),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("assetNo")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{tContracts("contractNo")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("owner")}</TableHead>
              <TableHead>{t("equipmentModel")}</TableHead>
              <TableHead>{t("qty")}</TableHead>
              <TableHead>{t("condition")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.asset_id}</TableCell>
                <TableCell>
                  {a.customer_code ? (
                    <Link href={`/${locale}/customers/${a.customer_code}`} className="hover:underline">
                      {a.customer_name}
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {a.contract_no ? (
                    <Link href={`/${locale}/contracts/${a.contract_no}`} className="hover:underline">
                      {a.contract_no}
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{a.type}</TableCell>
                <TableCell>{a.owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}</TableCell>
                <TableCell>
                  {a.name}
                  {a.model ? ` / ${a.model}` : ""}
                </TableCell>
                <TableCell>{a.qty}</TableCell>
                <TableCell>{a.condition}</TableCell>
              </TableRow>
            ))}
            {assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
