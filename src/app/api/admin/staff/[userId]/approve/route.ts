import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { approveProfile } from '@/lib/data-access/profiles';

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  const supabase = await createClient();
  const profile = await approveProfile(supabase, userId);

  await supabase.rpc('log_audit', {
    p_action: 'STAFF_SIGNUP_APPROVED',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { approved_by: master.userId },
  });

  return NextResponse.json(profile);
}
