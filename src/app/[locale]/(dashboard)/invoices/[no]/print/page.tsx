import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { getInvoice } from "@/lib/data-access/invoices";
import { getContract } from "@/lib/data-access/contracts";
import {
  listMeterReadingsByContractMonth,
  usageByCatalogId,
} from "@/lib/data-access/meter-readings";
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

  // The equipment breakdown lives on the invoiced contract's quote
  // snapshot, not on the invoice row. A missing contract_no (or a contract
  // since deleted) just means no equipment section — never a failed print.
  const contract = invoice.contract_no
    ? await getContract(supabase, invoice.contract_no, session!.role)
    : null;
  const usage = invoice.contract_no
    ? usageByCatalogId(
        await listMeterReadingsByContractMonth(supabase, invoice.contract_no, invoice.month)
      )
    : new Map();

  return (
    <InvoiceDocument
      invoice={invoice}
      equipmentSelections={contract?.quote_snapshot?.equipment_selections ?? []}
      usageByCatalogId={usage}
    />
  );
}
