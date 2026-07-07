import type { SupabaseClient } from '@supabase/supabase-js';
import type { Invoice, Contract, Customer } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { maskEmail } from '@/lib/masking/staff-masking';
import { nextInvoiceNo } from '@/lib/numbering';
import { isContractActiveInMonth, invoiceLineItems, invoiceTotals } from '@/lib/calc/invoice-calc';
import { listContracts } from '@/lib/data-access/contracts';

function applyInvoiceMasking(invoice: Invoice, role: StaffRole): Invoice {
  if (role === 'master') return invoice;
  return {
    ...invoice,
    recipient_email: maskEmail(invoice.recipient_email),
    sent_to: invoice.sent_to ? maskEmail(invoice.sent_to) : invoice.sent_to,
  };
}

export async function listInvoices(supabase: SupabaseClient, role: StaffRole): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Invoice[]).map((i) => applyInvoiceMasking(i, role));
}

export async function getInvoice(
  supabase: SupabaseClient,
  no: string,
  role: StaffRole
): Promise<Invoice | null> {
  const { data, error } = await supabase.from('invoices').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return applyInvoiceMasking(data as Invoice, role);
}

export async function getInvoiceByContractMonth(
  supabase: SupabaseClient,
  contractNo: string,
  month: string
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('contract_no', contractNo)
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  return data as Invoice | null;
}

export interface BillableRow {
  contract: Contract;
  customer: Customer;
  totals: ReturnType<typeof invoiceTotals>;
  invoice: Invoice | null;
  recipientEmail: string;
}

/** Ported 1:1 from the source app's renderInvoiceList()/billableContracts():
 * a contract is billable for `month` when not terminated and the month
 * falls within its billing window. Always computed against unmasked
 * customer/contract data — the caller decides what to mask for display. */
export async function listBillableContracts(
  supabase: SupabaseClient,
  month: string,
  ppnRate: number
): Promise<BillableRow[]> {
  const contracts = await listContracts(supabase, 'master');
  const billable = contracts.filter(
    (c) => c.status !== 'terminated' && isContractActiveInMonth(c, month)
  );
  if (!billable.length) return [];

  const { data: customersData, error: custError } = await supabase
    .from('customers')
    .select('*')
    .in(
      'code',
      billable.map((c) => c.customer_code)
    );
  if (custError) throw custError;
  const customers = customersData as Customer[];

  const { data: invoicesData, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .eq('month', month)
    .in(
      'contract_no',
      billable.map((c) => c.no)
    );
  if (invError) throw invError;
  const invoices = invoicesData as Invoice[];

  return billable.map((contract) => {
    const customer = customers.find((c) => c.code === contract.customer_code)!;
    const invoice = invoices.find((i) => i.contract_no === contract.no) ?? null;
    return {
      contract,
      customer,
      totals: invoiceTotals(contract, ppnRate),
      invoice,
      recipientEmail: (customer.invoice_email || customer.email || '').trim(),
    };
  });
}

export interface UpsertInvoiceOptions {
  markSent?: boolean;
  sendMethod?: string;
}

/** Ported 1:1 from the source app's upsertInvoice(): finds-or-creates the
 * invoice for (contractNo, month), refreshing computed fields every time
 * (so re-running "save" after a contract change updates the stored total). */
export async function upsertInvoice(
  supabase: SupabaseClient,
  contract: Contract,
  customer: Customer,
  month: string,
  date: string,
  dueDate: string,
  ppnRate: number,
  createdBy: string,
  options: UpsertInvoiceOptions = {}
): Promise<Invoice> {
  const existing = await getInvoiceByContractMonth(supabase, contract.no, month);
  const totals = invoiceTotals(contract, ppnRate);
  const recipientEmail = (customer.invoice_email || customer.email || '').trim();
  const items = invoiceLineItems(contract);
  const memo =
    'Managed IT Outsourcing 월 서비스 이용료입니다. Starlink 인터넷 서비스는 고객 명의 직접 가입/직접 납부 기준이며 BCT 청구 항목에 포함되지 않습니다.';

  const payload: Record<string, unknown> = {
    customer_code: contract.customer_code,
    customer_name: customer.name,
    contract_no: contract.no,
    month,
    date,
    due_date: dueDate,
    recipient_email: recipientEmail,
    items,
    subtotal: totals.subtotal,
    ppn: totals.ppn,
    total: totals.total,
    memo,
  };

  if (options.markSent) {
    payload.sent_at = new Date().toISOString();
    payload.sent_to = recipientEmail;
    payload.send_method = options.sendMethod ?? 'manual';
  }

  if (existing) {
    const { data, error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('no', existing.no)
      .select('*')
      .single();
    if (error) throw error;
    return data as Invoice;
  }

  const no = await nextInvoiceNo(supabase, new Date(date));
  const { data, error } = await supabase
    .from('invoices')
    .insert({ ...payload, no, created_by: createdBy })
    .select('*')
    .single();
  if (error) throw error;
  return data as Invoice;
}
