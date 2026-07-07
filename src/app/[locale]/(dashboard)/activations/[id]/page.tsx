import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getActivation } from "@/lib/data-access/activations";
import { listAssetsByContract } from "@/lib/data-access/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ActivationDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const activation = await getActivation(supabase, id);
  if (!activation) notFound();

  const [assets, t, tContracts, tCommon, tAssets] = await Promise.all([
    listAssetsByContract(supabase, activation.contract_no, session!.role),
    getTranslations("activations"),
    getTranslations("contracts"),
    getTranslations("common"),
    getTranslations("assets"),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    activated: t("statusActivated"),
    pending: t("statusPending"),
    issue: t("statusIssue"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {t("detailTitle")} {activation.id}
        </h1>
        <Badge variant={activation.status === "activated" ? "default" : "secondary"}>
          {STATUS_LABEL[activation.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activationInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{tContracts("contractNo")}</p>
            <p>{activation.contract_no}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("activationDate")}</p>
            <p>{activation.date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("billingStartDate")}</p>
            <p>{activation.billing_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("engineer")}</p>
            <p>{activation.engineer || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("installLocation")}</p>
            <p>{activation.site || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("sitePic")}</p>
            <p>{activation.customer_pic || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("confirmType")}</p>
            <p>{activation.confirm_type || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("securitySummary")}</p>
            <p>{activation.security_summary || "-"}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-muted-foreground">{t("notes")}</p>
            <p className="whitespace-pre-wrap">{activation.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("registeredAssetsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tAssets("assetNo")}</TableHead>
                <TableHead>{tAssets("type")}</TableHead>
                <TableHead>{tAssets("owner")}</TableHead>
                <TableHead>{tAssets("equipmentModel")}</TableHead>
                <TableHead>{tAssets("serial")}</TableHead>
                <TableHead>{tAssets("qty")}</TableHead>
                <TableHead>{tAssets("installLocation")}</TableHead>
                <TableHead>{tAssets("condition")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.asset_id}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.owner === "bct" ? tCommon("ownerBct") : tCommon("ownerCustomer")}</TableCell>
                  <TableCell>
                    {a.name}
                    {a.model ? ` / ${a.model}` : ""}
                  </TableCell>
                  <TableCell className="whitespace-pre-line">{a.serial || "-"}</TableCell>
                  <TableCell>{a.qty}</TableCell>
                  <TableCell>{a.location || "-"}</TableCell>
                  <TableCell>{a.condition}</TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {tAssets("empty")}
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
