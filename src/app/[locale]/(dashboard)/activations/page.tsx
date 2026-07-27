import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { listActivations } from "@/lib/data-access/activations";
import { listCustomers } from "@/lib/data-access/customers";
import { listIpPhoneExtensionsByCustomer } from "@/lib/data-access/ip-phone-extensions";
import { listServiceCredentialsByCustomer } from "@/lib/data-access/service-credentials";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLookupPicker } from "@/components/activations/customer-lookup-picker";
import { IpPhoneSection } from "@/components/activations/ip-phone-section";
import { ServiceCredentialSection } from "@/components/activations/service-credential-section";

export default async function ActivationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ customer?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { customer: selectedCustomerCode } = await searchParams;
  const session = await getSessionContext();
  const supabase = await createClient();
  const [activations, customers, t, tContracts] = await Promise.all([
    listActivations(supabase),
    listCustomers(supabase, session!.role),
    getTranslations("activations"),
    getTranslations("contracts"),
  ]);

  const [ipPhoneExtensions, serviceCredentials] = selectedCustomerCode
    ? await Promise.all([
        listIpPhoneExtensionsByCustomer(supabase, selectedCustomerCode),
        listServiceCredentialsByCustomer(supabase, selectedCustomerCode),
      ])
    : [[], []];

  const STATUS_LABEL: Record<string, string> = {
    activated: t("statusActivated"),
    pending: t("statusPending"),
    issue: t("statusIssue"),
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardAction>
            <Button asChild>
              <Link href={`/${locale}/activations/new`}>{t("newActivation")}</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("activationDate")}</TableHead>
                <TableHead>{tContracts("contractNo")}</TableHead>
                <TableHead>{t("engineer")}</TableHead>
                <TableHead>{t("installLocation")}</TableHead>
                <TableHead>{t("registeredAssets")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>
                    <Link href={`/${locale}/activations/${a.id}`} className="font-medium hover:underline">
                      {a.contract_no}
                    </Link>
                  </TableCell>
                  <TableCell>{a.engineer || "-"}</TableCell>
                  <TableCell>{a.site || "-"}</TableCell>
                  <TableCell>{a.asset_summary || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "activated" ? "default" : "secondary"}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {activations.length === 0 && (
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

      <Card>
        <CardHeader>
          <CardTitle>{t("lookupTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerLookupPicker customers={customers} selectedCode={selectedCustomerCode} />
        </CardContent>
      </Card>

      {selectedCustomerCode && (
        <>
          <IpPhoneSection customerCode={selectedCustomerCode} extensions={ipPhoneExtensions} />
          <ServiceCredentialSection customerCode={selectedCustomerCode} credentials={serviceCredentials} />
        </>
      )}
    </div>
  );
}
