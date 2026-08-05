import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { createStaffAccount } from '@/lib/auth/create-staff-account';

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['master', 'admin_dept', 'activation_dept', 'sales_agent']).default('admin_dept'),
  agent_code: z.string().optional(),
});

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

  const supabase = await createClient();
  try {
    const created = await createStaffAccount(supabase, master.userId, parsed.data);
    return NextResponse.json(created);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
