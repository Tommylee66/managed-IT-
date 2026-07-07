'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getQuoteRaw } from '@/lib/data-access/quotes';
import { getAgent } from '@/lib/data-access/agents';
import { getCustomerRaw } from '@/lib/data-access/customers';
import { createContractFromQuote } from '@/lib/data-access/contracts';

export async function createContractFromQuoteAction(quoteNo: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const t = await getTranslations('contracts');

  const quote = await getQuoteRaw(supabase, quoteNo);
  if (!quote) throw new Error(t('quoteNotFoundError'));
  if (!quote.agent_code) throw new Error(t('agentRequiredError'));

  const agent = await getAgent(supabase, quote.agent_code, 'master');
  if (!agent) throw new Error(t('agentNotFoundError'));

  const customer = await getCustomerRaw(supabase, quote.customer_code);
  if (!customer) throw new Error(t('customerNotFoundError'));

  const contract = await createContractFromQuote(supabase, quote, agent, customer, session.userId);
  revalidatePath('/contracts');
  revalidatePath('/customers');
  return contract;
}
