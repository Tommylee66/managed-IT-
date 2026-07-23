import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { requireMaster } from '@/lib/auth/session';
import { listContracts } from '@/lib/data-access/contracts';
import { listAgents } from '@/lib/data-access/agents';
import { calcMonthlyCommissionReport } from '@/lib/calc/commission-report';

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
  const [contracts, agents] = await Promise.all([listContracts(supabase, 'master'), listAgents(supabase, 'master')]);
  const npwpByAgentCode = new Map(agents.map((a) => [a.code, a.npwp]));
  const groups = calcMonthlyCommissionReport(contracts, month, npwpByAgentCode);
  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Commission ${month}`);
  sheet.columns = [
    { header: 'Agent Code', key: 'agentCode', width: 14 },
    { header: 'Agent Name', key: 'agentName', width: 22 },
    { header: 'NPWP', key: 'npwp', width: 22 },
    { header: 'Contract No', key: 'contractNo', width: 16 },
    { header: 'Customer', key: 'customerName', width: 24 },
    { header: 'Amount', key: 'amount', width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const g of groups) {
    for (const r of g.rows) {
      sheet.addRow({
        agentCode: g.agentCode,
        agentName: g.agentName,
        npwp: g.npwp ?? '',
        contractNo: r.contractNo,
        customerName: r.customerName,
        amount: r.amount,
      });
    }
    const subtotalRow = sheet.addRow({
      agentCode: g.agentCode,
      agentName: `${g.agentName} Subtotal`,
      amount: g.subtotal,
    });
    subtotalRow.font = { bold: true };
  }
  const totalRow = sheet.addRow({ agentName: 'Grand Total', amount: grandTotal });
  totalRow.font = { bold: true };
  sheet.getColumn('amount').numFmt = '#,##0';

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="commission-${month}.xlsx"`,
    },
  });
}
