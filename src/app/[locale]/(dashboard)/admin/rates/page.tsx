import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getRates } from "@/lib/data-access/rates";
import { listEquipmentCatalog } from "@/lib/data-access/equipment";
import type { Rates } from "@/types/domain";
import { EditRatesForm } from "@/components/rates/edit-rates-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils/currency";
import { EquipmentDialog } from "@/components/admin/equipment-dialog";
import { ToggleEquipmentActiveButton } from "@/components/admin/toggle-equipment-active-button";

export default async function AdminRatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [rates, equipmentItems, t, tCat] = await Promise.all([
    getRates(supabase, "master") as Promise<Rates>,
    listEquipmentCatalog(supabase),
    getTranslations("admin"),
    getTranslations("equipmentCategory"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("ratesTitle")}</h1>
      <EditRatesForm rates={rates} />

      <Card>
        <CardHeader>
          <CardTitle>{t("equipmentTitle")}</CardTitle>
          <CardAction>
            <EquipmentDialog />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("equipmentCategory")}</TableHead>
                <TableHead>{t("equipmentModelName")}</TableHead>
                <TableHead>{t("equipmentSpecId")}</TableHead>
                <TableHead>{t("equipmentSpecKo")}</TableHead>
                <TableHead className="text-right">{t("equipmentPurchasePrice")}</TableHead>
                <TableHead className="text-right">{t("equipmentMonthlyRate")}</TableHead>
                <TableHead className="text-right">{t("equipmentMonthlyCost")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{tCat(item.category)}</TableCell>
                  <TableCell>{item.model_name}</TableCell>
                  <TableCell>{item.spec_id ?? "-"}</TableCell>
                  <TableCell>{item.spec_ko ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {item.purchase_price != null ? formatRupiah(item.purchase_price) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.monthly_rate != null ? formatRupiah(item.monthly_rate) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.monthly_cost != null ? formatRupiah(item.monthly_cost) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <EquipmentDialog item={item} />
                    <ToggleEquipmentActiveButton id={item.id} active={item.is_active} />
                  </TableCell>
                </TableRow>
              ))}
              {equipmentItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {t("noEquipment")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
