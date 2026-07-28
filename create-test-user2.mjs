import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const email = 'pdf-test-prod@bct.local';
const password = 'PdfTestProd12345!';

let { data, error } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true,
});
if (error && error.message.includes('already been registered')) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find(u => u.email === email);
  await supabase.auth.admin.updateUserById(existing.id, { password });
  data = { user: existing };
  console.log('reused existing user, reset password');
} else if (error) {
  console.error('createUser error:', error.message); process.exit(1);
}

const { error: profErr } = await supabase.from('profiles').upsert({
  id: data.user.id,
  full_name: 'PDF Test Prod',
  role: 'master',
  is_active: true,
  is_approved: true,
});
if (profErr) { console.error('profile upsert error:', profErr.message); process.exit(1); }
console.log('user id:', data.user.id, 'login with', email, password);
