import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listAllAssets } from "@/lib/data-access/assets";
import { listCustomers } from "@/lib/data-access/customers";
import { listContracts } from "@/lib/data-access/contracts";
import { listEquipmentCatalog } from "@/lib/data-access/equipment";
import { ASSET_DEFAULT_NAMES, ASSET_TYPES, type AssetOptionMap } from "@/lib/assets/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetDialog } from "@/components/assets/asset-dialog";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const isMaster = session!.role === "master";
  const [assets, customers, contracts, equipment, t, tContracts, tCommon, tCategory] = await Promise.all([
    listAllAssets(supabase, session!.role),
    isMaster ? listCustomers(supabase, session!.role) : Promise.resolve([]),
    isMaster ? listContracts(supabase, session!.role) : Promise.resolve([]),
    isMaster ? listEquipmentCatalog(supabase, { activeOnly: true, role: "master" }) : Promise.resolve([]),
    getTranslations("assets"),
    getTranslations("contracts"),
    getTranslations("common"),
    getTranslations("equipmentCategory"),
  ]);
  const customerOptions = customers.map(({ code, name }) => ({ code, name }));
  const contractOptions = contracts.map(({ no, customer_code, customer_name }) => ({
    no,
    customer_code,
    customer_name,
  }));
  const nameOptions = Object.fromEntries(
    ASSET_TYPES.map((type) => [
      type,
      [...new Set([
        ASSET_DEFAULT_NAMES[type],
        ...assets
          .filter((asset) => asset.type === type)
          .map((asset) => asset.name)
          .filter((name): name is string => Boolean(name)),
      ])].sort((a, b) => a.localeCompare(b)),
    ])
  ) as AssetOptionMap;
  const modelOptions = Object.fromEntries(
    ASSET_TYPES.map((type) => [
      type,
      [...new Set([
        ...equipment.filter((item) => item.category === type).map((item) => item.model_name),
        ...assets
          .filter((asset) => asset.type === type)
          .map((asset) => asset.model)
          .filter((model): model is string => Boolean(model)),
      ])].sort((a, b) => a.localeCompare(b)),
    ])
  ) as AssetOptionMap;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        {isMaster && <CardDescription>{t("masterDescription")}</CardDescription>}
        {isMaster && (
          <CardAction className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/audit-log?target_table=assets`}>{t("allHistory")}</Link>
            </Button>
            <AssetDialog
              customers={customerOptions}
              contracts={contractOptions}
              nameOptions={nameOptions}
              modelOptions={modelOptions}
            />
          </CardAction>
        )}
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
              {isMaster && <TableHead className="text-right">{t("actions")}</TableHead>}
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
                <TableCell>{tCategory(a.type)}</TableCell>
                <TableCell>{a.owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}</TableCell>
                <TableCell>
                  {a.name}
                  {a.model ? ` / ${a.model}` : ""}
                </TableCell>
                <TableCell>{a.qty}</TableCell>
                <TableCell>{t(`condition_${a.condition}`)}</TableCell>
                {isMaster && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${locale}/admin/audit-log?target_table=assets&target_id=${a.asset_id}`}>
                          {t("history")}
                        </Link>
                      </Button>
                      <AssetDialog
                        asset={a}
                        customers={customerOptions}
                        contracts={contractOptions}
                        nameOptions={nameOptions}
                        modelOptions={modelOptions}
                      />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={isMaster ? 9 : 8} className="text-center text-muted-foreground">
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
