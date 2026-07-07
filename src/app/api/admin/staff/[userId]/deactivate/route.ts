import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireMaster } from '@/lib/auth/session';
import { setProfileActive } from '@/lib/data-access/profiles';

const schema = z.object({ active: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  if (userId === master.userId) {
    return NextResponse.json({ error: 'Cannot deactivate your own account.' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const profile = await setProfileActive(supabase, userId, parsed.data.active);

  // Defense in depth: also block sign-in at the Auth layer, not just the
  // application-level is_active flag.
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, {
    ban_duration: parsed.data.active ? 'none' : '876000h',
  });

  await supabase.rpc('log_audit', {
    p_action: parsed.data.active ? 'STAFF_REACTIVATED' : 'STAFF_DEACTIVATED',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { changed_by: master.userId },
  });

  return NextResponse.json(profile);
}
