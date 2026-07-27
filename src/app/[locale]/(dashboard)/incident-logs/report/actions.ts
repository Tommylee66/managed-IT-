'use server';

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth/session';
import { listIncidentLogsByCustomerAndMonth } from '@/lib/data-access/incident-logs';
import { getCustomer } from '@/lib/data-access/customers';
import { generateReportDraft } from '@/lib/ai/report-draft';
import { buildReportEmailHtml } from '@/lib/email/report-email-template';
import type { IncidentLog } from '@/types/domain';

// The report body itself is always bilingual ID+KO (see report-draft.ts's
// prompt), matching every other customer-facing document in the app — so
// the month label feeding into it is bilingual too, not locale-switched.
function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const id = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  const ko = `${year}년 ${Number(month)}월`;
  return `${id} (${ko})`;
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
  const t = await getTranslations('incidentLogs');
  const [customer, records] = await Promise.all([
    getCustomer(supabase, customerCode, session.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, monthKey),
  ]);
  if (!customer) throw new Error(t('reportCustomerNotFoundError'));
  return { customerName: customer.name, records };
}

export async function generateReportDraftAction(customerCode: string, monthKey: string) {
  const session = await getSessionContext();
  if (!session) throw new Error('Unauthorized');
  const supabase = await createClient();
  const t = await getTranslations('incidentLogs');
  const [customer, records] = await Promise.all([
    getCustomer(supabase, customerCode, session.role),
    listIncidentLogsByCustomerAndMonth(supabase, customerCode, monthKey),
  ]);
  if (!customer) throw new Error(t('reportCustomerNotFoundError'));
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
  const t = await getTranslations('incidentLogs');
  const customer = await getCustomer(supabase, customerCode, session.role);
  if (!customer) throw new Error(t('reportCustomerNotFoundError'));

  const to = customer.invoice_email || customer.email;
  if (!to) throw new Error(t('reportNoEmailError'));

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(t('reportResendKeyMissingError'));
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
    throw new Error(t('reportEmailSendError', { status: res.status, detail: await res.text() }));
  }

  await supabase.rpc('log_audit', {
    p_action: 'MONTHLY_REPORT_SENT',
    p_target_table: 'customers',
    p_target_id: customerCode,
    p_details: { month: monthKey, to, sent_by: session.userId },
  });

  return { sentTo: to };
}
