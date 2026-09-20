import { NextRequest, NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { exportAgentPersonalData } from '@/lib/data-access/agents';
import { exportCustomerPersonalData } from '@/lib/data-access/customers';

export const runtime = 'nodejs';

/**
 * Data portability (UU PDP art. 13): hands back everything held about one
 * data subject as JSON, so a request to receive one's own data can be
 * answered without a developer running queries by hand.
 *
 * Master-only. The right belongs to the data subject, but subjects here are
 * a company's contact or a sales agent — neither has a login that could
 * prove identity for the other's record, so the request arrives off-system
 * (email, letter) and a master fulfils it after verifying who is asking.
 * That verification is a procedure, not code; this route is the part that
 * has to be reliable.
 */
export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const supabase = await createClient();

  const type = req.nextUrl.searchParams.get('type');
  const code = req.nextUrl.searchParams.get('code')?.trim() ?? '';
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }
  if (type !== 'agent' && type !== 'customer') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const payload =
    type === 'agent'
      ? await exportAgentPersonalData(supabase, code)
      : await exportCustomerPersonalData(supabase, code);

  const { error: auditError } = await supabase.rpc('log_audit', {
    p_action: 'PERSONAL_DATA_EXPORTED',
    p_target_table: type === 'agent' ? 'agents' : 'customers',
    p_target_id: code,
    p_details: { role: session.role },
  });
  if (auditError) throw auditError;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${type}-${code}.json"`,
    },
  });
}
