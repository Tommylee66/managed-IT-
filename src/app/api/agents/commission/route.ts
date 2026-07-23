import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { listContracts } from '@/lib/data-access/contracts';
import { calcMonthlyCommissionReport } from '@/lib/calc/commission-report';

const BOM = '﻿';

function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  try {
    await requireMaster();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month =
    searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const supabase = await createClient();
  const contracts = await listContracts(supabase, 'master');
  const groups = calcMonthlyCommissionReport(contracts, month);

  const lines = ['Agent Code,Agent Name,Contract No,Customer,Amount'];
  for (const g of groups) {
    for (const r of g.rows) {
      lines.push(
        [csvField(r.agentCode), csvField(r.agentName), csvField(r.contractNo), csvField(r.customerName), r.amount].join(
          ','
        )
      );
    }
    lines.push([csvField(g.agentCode), csvField(`${g.agentName} Subtotal`), '', '', g.subtotal].join(','));
  }
  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  lines.push(['', 'Grand Total', '', '', grandTotal].join(','));

  // BOM so Excel opens this as UTF-8 instead of mangling Korean/Indonesian text.
  const csv = BOM + lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="commission-${month}.csv"`,
    },
  });
}
