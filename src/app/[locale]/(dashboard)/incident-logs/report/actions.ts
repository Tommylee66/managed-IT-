'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { listIncidentLogsByCustomerAndMonth } from '@/lib/data-access/incident-logs';
import { getCustomer } from '@/lib/data-access/customers';
import { generateReportDraft } from '@/lib/ai/report-draft';
import { buildReportEmailHtml } from '@/lib/email/report-email-template';
import type { IncidentLog } from '@/types/domain';

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${year}년 ${Number(month)}월`;
}

export interface ReportRecordsResult {
  customerName: string;
  records: IncidentLog[];
}

export async function loadReportRecordsAction(
  customerCode: string,
  monthKey: string
): Promise<ReportRecordsResult> {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const [customer, records] = await Promise.all([
    getCustomer(supabase, customerCode, session.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, monthKey),
  ]);
  if (!customer) throw new Error('고객을 찾을 수 없습니다.');
  return { customerName: customer.name, records };
}

export async function generateReportDraftAction(customerCode: string, monthKey: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const [customer, records] = await Promise.all([
    getCustomer(supabase, customerCode, session.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, monthKey),
  ]);
  if (!customer) throw new Error('고객을 찾을 수 없습니다.');
  const result = await generateReportDraft({
    customerName: customer.name,
    monthLabel: monthLabel(monthKey),
    records,
  });
  return { ...result, recordCount: records.length };
}

export async function sendReportEmailAction(
  customerCode: string,
  monthKey: string,
  subject: string,
  body: string
) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const customer = await getCustomer(supabase, customerCode, session.role);
  if (!customer) throw new Error('고객을 찾을 수 없습니다.');

  const to = customer.invoice_email || customer.email;
  if (!to) throw new Error('고객에게 등록된 이메일 주소가 없습니다. 고객 정보에 이메일을 먼저 등록해주세요.');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY가 설정되지 않았습니다. 관리자에게 이메일 발송 기능 설정을 요청해주세요.');
  }
  const fromAddress = process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev';
  const html = buildReportEmailHtml({ customerName: customer.name, monthLabel: monthLabel(monthKey), bodyText: body });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      text: body,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`이메일 발송 실패 (${res.status}): ${await res.text()}`);
  }

  await supabase.rpc('log_audit', {
    p_action: 'MONTHLY_REPORT_SENT',
    p_target_table: 'customers',
    p_target_id: customerCode,
    p_details: { month: monthKey, to, sent_by: session.userId },
  });

  return { sentTo: to };
}
