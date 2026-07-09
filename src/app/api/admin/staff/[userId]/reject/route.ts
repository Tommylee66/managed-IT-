import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireMaster } from '@/lib/auth/session';

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', userId)
    .single();

  // Rejection only makes sense for a signup that's still pending — refuse to
  // use this route to remove an already-approved staff member.
  if (!profile || profile.is_approved) {
    return NextResponse.json({ error: 'Only pending signups can be rejected' }, { status: 400 });
  }

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_SIGNUP_REJECTED',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { rejected_by: master.userId },
  });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: userId, deleted: true });
}
