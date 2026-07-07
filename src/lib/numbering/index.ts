import type { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// All numbering happens server-side only (Route Handlers / Server Actions),
// via the next_number() Postgres RPC — the atomic upsert there is what
// makes this safe under concurrent multi-user submits, unlike the source
// app's client-side array.length counter.

async function nextSequence(supabase: SupabaseClient, scope: string): Promise<number> {
  const { data, error } = await supabase.rpc('next_number', { p_scope: scope });
  if (error) throw error;
  return data as number;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

export async function nextCustomerCode(supabase: SupabaseClient): Promise<string> {
  return 'CUS' + pad(await nextSequence(supabase, 'customer'), 3);
}

export async function nextAgentCode(supabase: SupabaseClient): Promise<string> {
  return 'AGT' + pad(await nextSequence(supabase, 'agent'), 3);
}

export async function nextAssetId(supabase: SupabaseClient): Promise<string> {
  return 'AST' + pad(await nextSequence(supabase, 'asset'), 5);
}

export async function nextQuoteNo(supabase: SupabaseClient, date = new Date()): Promise<string> {
  const ymd = format(date, 'yyyyMMdd');
  const n = await nextSequence(supabase, `quote:${ymd}`);
  return `QUO${ymd}-${pad(n, 3)}`;
}

export async function nextContractNo(supabase: SupabaseClient, date = new Date()): Promise<string> {
  const ymd = format(date, 'yyyyMMdd');
  const n = await nextSequence(supabase, `contract:${ymd}`);
  return `CTR${ymd}-${pad(n, 3)}`;
}

export async function nextApplicationNo(supabase: SupabaseClient, date = new Date()): Promise<string> {
  const ymd = format(date, 'yyyyMMdd');
  const n = await nextSequence(supabase, `application:${ymd}`);
  return `APP${ymd}-${pad(n, 3)}`;
}

export async function nextChangeRequestNo(supabase: SupabaseClient, date = new Date()): Promise<string> {
  const ymd = format(date, 'yyyyMMdd');
  const n = await nextSequence(supabase, `change:${ymd}`);
  return `CHG${ymd}-${pad(n, 3)}`;
}

// Matches the source app's invoiceNo() exactly: per-day sequence (not
// per-month) despite invoices being conceptually monthly billing documents.
export async function nextInvoiceNo(supabase: SupabaseClient, date = new Date()): Promise<string> {
  const ymd = format(date, 'yyyyMMdd');
  const n = await nextSequence(supabase, `invoice:${ymd}`);
  return `INV${ymd}-${pad(n, 3)}`;
}

// Timestamp-based IDs: inherently concurrency-safe (no shared counter to
// race on) as long as strict sequential ordering isn't required. A short
// random suffix rules out same-millisecond collisions under concurrent submits.
function timestampId(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}${Date.now().toString(36)}${suffix}`;
}

export const nextActivationId = () => timestampId('ACT');
export const nextAssetHistoryId = () => timestampId('AH');
export const nextTerminationPlanId = () => timestampId('TRP');
export const nextServiceLogId = () => timestampId('LOG');
