import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { setProfileRole } from '@/lib/data-access/profiles';
import { MAX_MASTER_ACCOUNTS } from '@/lib/auth/constants';

const schema = z.object({
  role: z.enum(['master', 'admin_dept', 'activation_dept', 'sales_agent']),
  agent_code: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  if (userId === master.userId) {
    return NextResponse.json({ error: 'SELF_ROLE_CHANGE' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();

  if (parsed.data.role === 'master') {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'master')
      .eq('is_active', true);
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }
    if ((count ?? 0) >= MAX_MASTER_ACCOUNTS) {
      return NextResponse.json({ error: 'MAX_MASTER_ACCOUNTS' }, { status: 400 });
    }
  }

  const profile = await setProfileRole(supabase, userId, parsed.data.role, parsed.data.agent_code ?? null);

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_ROLE_CHANGED',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { new_role: parsed.data.role, changed_by: master.userId },
  });

  return NextResponse.json(profile);
}
