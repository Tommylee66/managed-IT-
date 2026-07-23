import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireMaster } from '@/lib/auth/session';

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['master', 'admin_dept', 'activation_dept', 'sales_agent']).default('admin_dept'),
});

const MAX_MASTER_ACCOUNTS = 2;

export async function POST(request: Request) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { email, password, full_name, role } = parsed.data;

  const supabase = await createClient();
  if (role === 'master') {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'master')
      .eq('is_active', true);
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }
    if ((count ?? 0) >= MAX_MASTER_ACCOUNTS) {
      return NextResponse.json(
        { error: `마스터 관리자는 최대 ${MAX_MASTER_ACCOUNTS}명까지만 가능합니다.` },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, pre_approved: true },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 400 });
  }

  if (role === 'master') {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'master' })
      .eq('id', created.user.id);
    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 });
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_CREATED',
    p_target_table: 'profiles',
    p_target_id: created.user.id,
    p_details: { email, role, created_by: master.userId },
  });

  return NextResponse.json({ id: created.user.id, email, full_name, role });
}
