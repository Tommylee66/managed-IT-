'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { getQuoteRaw } from '@/lib/data-access/quotes';
import { getAgent } from '@/lib/data-access/agents';
import { getCustomerRaw } from '@/lib/data-access/customers';
import { createContractFromQuote, getContractByQuoteNo, confirmContract } from '@/lib/data-access/contracts';

export async function createContractFromQuoteAction(quoteNo: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const t = await getTranslations('contracts');

  const existing = await getContractByQuoteNo(supabase, quoteNo);
  if (existing) throw new Error(t('contractAlreadyExistsError', { no: existing.no }));

  const quote = await getQuoteRaw(supabase, quoteNo);
  if (!quote) throw new Error(t('quoteNotFoundError'));
  if (!quote.agent_code) throw new Error(t('agentRequiredError'));

  const agent = await getAgent(supabase, quote.agent_code, 'master');
  if (!agent) throw new Error(t('agentNotFoundError'));

  const customer = await getCustomerRaw(supabase, quote.customer_code);
  if (!customer) throw new Error(t('customerNotFoundError'));

  try {
    const contract = await createContractFromQuote(supabase, quote, agent, customer, session.userId);
    revalidatePath('/contracts');
    revalidatePath('/customers');
    return contract;
  } catch (e) {
    // The check above has a narrow check-then-insert race window (two
    // concurrent submissions, e.g. a double-click, can both pass it before
    // either insert lands) — the database's unique constraint on quote_no
    // (see contracts_quote_no_unique) is the real backstop. This turns
    // that constraint violation (Postgres 23505) into the same friendly
    // message instead of a raw database error.
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === '23505') {
      const winner = await getContractByQuoteNo(supabase, quoteNo);
      throw new Error(t('contractAlreadyExistsError', { no: winner?.no ?? quoteNo }));
    }
    throw e;
  }
}

export async function confirmContractAction(contractNo: string) {
  const session = await getSessionContext();
  if (!session || session.role !== 'master') throw new Error('Unauthorized');
  const supabase = await createClient();
  const contract = await confirmContract(supabase, contractNo);
  revalidatePath('/contracts');
  revalidatePath(`/contracts/${contractNo}`);
  revalidatePath('/dashboard');
  return contract;
}
