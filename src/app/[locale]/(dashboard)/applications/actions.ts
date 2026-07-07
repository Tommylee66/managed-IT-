'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getRates } from '@/lib/data-access/rates';
import { createCustomer } from '@/lib/data-access/customers';
import {
  createApplication,
  getApplication,
  convertApplicationToQuote,
  type CreateApplicationInput,
} from '@/lib/data-access/applications';
import type { Rates, QuoteInputs } from '@/types/domain';

export interface CreateApplicationFormInput {
  source: string;
  customer_code?: string;
  new_customer_name?: string;
  new_customer_phone?: string;
  new_customer_email?: string;
  new_customer_tax_id?: string;
  agent_code?: string;
  start_date: string;
  months: number;
  billing_date: string;
  inputs: QuoteInputs;
  memo?: string;
}

export async function createApplicationAction(input: CreateApplicationFormInput) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();

  let customerCode = input.customer_code;
  let customerName = '';

  if (!customerCode) {
    if (!input.new_customer_name) {
      const t = await getTranslations('applications');
      throw new Error(t('selectOrNewCustomerError'));
    }
    const customer = await createCustomer(supabase, {
      name: input.new_customer_name,
      phone: input.new_customer_phone,
      email: input.new_customer_email,
      tax_id: input.new_customer_tax_id,
      memo: '신규 신청 접수로 자동 등록',
      created_by: session.userId,
    });
    customerCode = customer.code;
    customerName = customer.name;
  } else {
    const { data } = await supabase.from('customers').select('name').eq('code', customerCode).single();
    customerName = data?.name ?? customerCode;
  }

  const rates = (await getRates(supabase, 'master')) as Rates;
  const createInput: CreateApplicationInput = {
    source: input.source,
    customer_code: customerCode,
    customer_name: customerName,
    agent_code: input.agent_code,
    start_date: input.start_date,
    months: input.months,
    billing_date: input.billing_date,
    inputs: input.inputs,
    memo: input.memo,
    created_by: session.userId,
  };
  const application = await createApplication(supabase, rates, createInput);
  revalidatePath('/applications');
  revalidatePath('/customers');
  return application;
}

export async function convertApplicationToQuoteAction(applicationNo: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const application = await getApplication(supabase, applicationNo);
  if (!application) {
    const t = await getTranslations('applications');
    throw new Error(t('notFoundError'));
  }
  const rates = (await getRates(supabase, 'master')) as Rates;
  const quoteNo = await convertApplicationToQuote(supabase, application, rates, session.userId);
  revalidatePath('/applications');
  revalidatePath('/quotes');
  return quoteNo;
}
