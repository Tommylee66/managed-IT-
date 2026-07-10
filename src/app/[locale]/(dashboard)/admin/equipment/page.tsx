import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listEquipmentCatalog } from "@/lib/data-access/equipment";
import { formatRupiah } from "@/lib/utils/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEquipmentDialog } from "@/components/admin/create-equipment-dialog";
import { ToggleEquipmentActiveButton } from "@/components/admin/toggle-equipment-active-button";

export default async function AdminEquipmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  if (!session || session.role !== "master") redirect("/dashboard");

  const supabase = await createClient();
  const [items, t, tCat] = await Promise.all([
    listEquipmentCatalog(supabase),
    getTranslations("admin"),
    getTranslations("equipmentCategory"),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("equipmentTitle")}</CardTitle>
        <CardAction>
          <CreateEquipmentDialog />
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
              <TableHead className="text-right">{t("equipmentMonthlyRate")}</TableHead>
              <TableHead className="text-right">{t("equipmentMonthlyCost")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{tCat(item.category)}</TableCell>
                <TableCell>{item.model_name}</TableCell>
                <TableCell>{item.spec_id ?? "-"}</TableCell>
                <TableCell>{item.spec_ko ?? "-"}</TableCell>
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
                <TableCell>
                  <ToggleEquipmentActiveButton id={item.id} active={item.is_active} />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {t("noEquipment")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
