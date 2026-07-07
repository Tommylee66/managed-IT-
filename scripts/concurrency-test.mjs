import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing env vars');

const supabase = createClient(url, key);
const SCOPE = 'concurrency-test:' + Date.now();
const CONCURRENCY = 30;

const results = await Promise.all(
  Array.from({ length: CONCURRENCY }, () =>
    supabase.rpc('next_number', { p_scope: SCOPE }).then((r) => {
      if (r.error) throw r.error;
      return r.data;
    })
  )
);

const unique = new Set(results);
console.log('Calls:', CONCURRENCY);
console.log('Unique values:', unique.size);
console.log('Values:', [...results].sort((a, b) => a - b).join(','));
console.log(unique.size === CONCURRENCY ? 'PASS: no duplicates' : 'FAIL: duplicates found');

// cleanup
await supabase.from('numbering_sequences').delete().eq('scope', SCOPE);
