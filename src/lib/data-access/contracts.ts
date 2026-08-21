import type { SupabaseClient } from '@supabase/supabase-js';
import type { Contract, Quote, Agent, Customer } from '@/types/domain';
import type { StaffRole } from '@/lib/masking/staff-masking';
import { calculateCommission, calcBlendedMonthlyCommission } from '@/lib/calc/commission-calc';
import { nextContractNo } from '@/lib/numbering';

// Commission figures are hidden entirely for staff (see hideCommission() in
// staff-masking.ts) — the UI layer checks Number.isNaN on these fields and
// renders '***' instead of formatting them as currency.
function applyContractMasking(contract: Contract, role: StaffRole): Contract {
  if (role === 'master') return contract;
  return {
    ...contract,
    commission_rate: NaN,
    monthly_commission: NaN,
    half_monthly_commission: NaN,
    total_commission: NaN,
  };
}

export async function listContracts(
  supabase: SupabaseClient,
  role: StaffRole
): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Contract[]).map((c) => applyContractMasking(c, role));
}

export async function listContractsByCustomer(
  supabase: SupabaseClient,
  customerCode: string,
  role: StaffRole
): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('customer_code', customerCode)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Contract[]).map((c) => applyContractMasking(c, role));
}

export async function getContract(
  supabase: SupabaseClient,
  no: string,
  role: StaffRole
): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return applyContractMasking(data as Contract, role);
}

export async function getContractRaw(
  supabase: SupabaseClient,
  no: string
): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('no', no).maybeSingle();
  if (error) throw error;
  return data as Contract | null;
}

/** Used to guard against converting the same quote into a contract more
 * than once — nothing previously stopped the "create contract" action from
 * being called repeatedly against one quote_no, which produced duplicate
 * contract rows (and duplicated MRR) for a single real deal. Uses
 * limit(1) + array indexing rather than .maybeSingle(), which throws a
 * hard Postgrest error the instant more than one row matches — exactly the
 * state a duplicate-quote_no incident leaves behind, which would otherwise
 * turn every future attempt to touch that quote into a crash instead of
 * the intended friendly "already converted" message. */
export async function getContractByQuoteNo(
  supabase: SupabaseClient,
  quoteNo: string
): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('quote_no', quoteNo).limit(1);
  if (error) throw error;
  return (data as Contract[])[0] ?? null;
}

/** Flips a contract from "just created from a quote" to "confirmed real
 * business" — see the `confirmed_at` doc comment on the Contract type for
 * what this does and does not gate. */
export async function confirmContract(supabase: SupabaseClient, no: string): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('no', no)
    .select('*')
    .single();
  if (error) throw error;
  return data as Contract;
}

/** Ported 1:1 from the source app's contractFromApplication()/quote-confirm
 * flow: locks in commission terms at contract creation and flips the
 * customer's status to 'contracted'. */
export async function createContractFromQuote(
  supabase: SupabaseClient,
  quote: Quote,
  agent: Agent,
  customer: Customer,
  createdBy: string
): Promise<Contract> {
  const no = await nextContractNo(supabase);
  // Most rows earn commission at the agent's own rate; a row snapshotted
  // from a catalog item with its own commission_rate_override earns
  // commission at that rate instead (see calcBlendedMonthlyCommission) —
  // with no overridden rows this is identical to commissionBase × agent.rate.
  const monthlyCommission = calcBlendedMonthlyCommission(quote.commission_base, quote.rows, agent.rate);
  const commission = calculateCommission(monthlyCommission, quote.start_date!, quote.months);

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      no,
      quote_no: quote.no,
      customer_code: customer.code,
      customer_name: customer.name,
      agent_code: agent.code,
      agent_name: agent.name,
      start_date: quote.start_date,
      billing_date: quote.billing_date,
      end_date: commission.commissionFullEnd,
      months: quote.months,
      monthly_fee: quote.monthly,
      commission_base: quote.commission_base,
      commission_rate: agent.rate,
      monthly_commission: commission.monthlyCommission,
      half_monthly_commission: commission.halfMonthlyCommission,
      commission_full_end: commission.commissionFullEnd,
      commission_half_start: commission.commissionHalfStart,
      total_commission: commission.totalCommission,
      quote_snapshot: quote,
      status: 'contracted',
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;

  const { error: custError } = await supabase
    .from('customers')
    .update({ status: 'contracted', contract_no: no, agent_code: agent.code })
    .eq('code', customer.code);
  if (custError) throw custError;

  return data as Contract;
}
