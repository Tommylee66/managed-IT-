'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getRates } from '@/lib/data-access/rates';
import { getContractRaw } from '@/lib/data-access/contracts';
import { getCustomerRaw } from '@/lib/data-access/customers';
import { upsertInvoice, recordInvoicePayment, getInvoice } from '@/lib/data-access/invoices';
import { nextServiceLogId } from '@/lib/numbering';
import type { Rates } from '@/types/domain';

async function upsertOne(
  contractNo: string,
  month: string,
  date: string,
  dueDate: string,
  markSent: boolean,
  userId: string
) {
  const supabase = await createClient();
  const t = await getTranslations('invoices');
  const rates = (await getRates(supabase, 'master')) as Rates;
  const contract = await getContractRaw(supabase, contractNo);
  if (!contract) throw new Error(t('contractNotFoundError', { no: contractNo }));
  const customer = await getCustomerRaw(supabase, contract.customer_code);
  if (!customer) throw new Error(t('customerNotFoundError', { code: contract.customer_code }));

  const invoice = await upsertInvoice(
    supabase,
    contract,
    customer,
    month,
    date,
    dueDate,
    rates.ppn,
    userId,
    markSent ? { markSent: true, sendMethod: 'manual' } : {}
  );

  await supabase.from('service_logs').insert({
    id: nextServiceLogId(),
    customer_code: customer.code,
    date,
    type: markSent ? t('serviceLogTypeSent') : t('serviceLogTypeIssued'),
    title: `${invoice.no} / ${month}`,
    memo: markSent
      ? t('serviceLogMemoSent', { email: invoice.recipient_email ?? '', total: invoice.total })
      : t('serviceLogMemoIssued', { total: invoice.total }),
    saved_by: userId,
  });

  return invoice;
}

export async function saveInvoicesAction(
  contractNos: string[],
  month: string,
  date: string,
  dueDate: string
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const results = [];
  for (const no of contractNos) {
    results.push(await upsertOne(no, month, date, dueDate, false, session.userId));
  }
  revalidatePath('/invoices');
  return results;
}

export async function markInvoicesSentAction(
  contractNos: string[],
  month: string,
  date: string,
  dueDate: string
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const results = [];
  for (const no of contractNos) {
    results.push(await upsertOne(no, month, date, dueDate, true, session.userId));
  }
  revalidatePath('/invoices');
  return results;
}

export async function recordInvoicePaymentAction(no: string, paidAmount: number, paidAtISO: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const t = await getTranslations('invoices');
  const existing = await getInvoice(supabase, no, session.role);
  if (!existing) throw new Error(t('invoiceNotFoundError', { no }));

  const invoice = await recordInvoicePayment(supabase, no, paidAmount, paidAtISO);

  await supabase.from('service_logs').insert({
    id: nextServiceLogId(),
    customer_code: invoice.customer_code,
    date: paidAtISO.slice(0, 10),
    type: '결제확인',
    title: `${invoice.no} / ${invoice.month}`,
    memo: t('serviceLogMemoPaid', { amount: paidAmount, total: invoice.total }),
    saved_by: session.userId,
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${no}`);
  return invoice;
}
