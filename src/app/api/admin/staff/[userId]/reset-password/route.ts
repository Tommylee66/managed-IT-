import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireMaster } from '@/lib/auth/session';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  let master;
  try {
    master = await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.rpc('log_audit', {
    p_action: 'PASSWORD_RESET',
    p_target_table: 'profiles',
    p_target_id: userId,
    p_details: { reset_by: master.userId },
  });

  return NextResponse.json({ ok: true });
}
