import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { setProfileAgentCode } from '@/lib/data-access/profiles';

const schema = z.object({ agent_code: z.string().nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (targetError || !target) {
    return NextResponse.json({ error: targetError?.message ?? 'Staff account not found' }, { status: 404 });
  }
  if (target.role !== 'sales_agent') {
    return NextResponse.json({ error: 'NOT_SALES_AGENT' }, { status: 400 });
  }

  const profile = await setProfileAgentCode(supabase, userId, parsed.data.agent_code);

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_AGENT_LINKED',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { agent_code: parsed.data.agent_code, changed_by: master.userId },
  });

  return NextResponse.json(profile);
}
