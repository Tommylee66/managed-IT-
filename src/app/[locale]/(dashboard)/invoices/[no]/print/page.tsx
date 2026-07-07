import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getInvoice } from "@/lib/data-access/invoices";
import { InvoiceDocument } from "@/components/documents/invoice-document";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ no: string; locale: string }>;
}) {
  const { no, locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const invoice = await getInvoice(supabase, no, session!.role);
  if (!invoice) notFound();

  return <InvoiceDocument invoice={invoice} />;
}
