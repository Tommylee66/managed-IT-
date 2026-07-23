import type { IncidentLog } from '@/types/domain';

export interface ReportContext {
  customerName: string;
  monthLabel: string;
  records: IncidentLog[];
}

export type ReportDraftSource = 'anthropic' | 'openai' | 'template';

function buildPrompt(ctx: ReportContext): string {
  const lines = ctx.records
    .map(
      (r) =>
        `- [${r.type === 'incident' ? '장애처리' : '정기점검'}] ${r.occurred_date} ${r.title}: ${r.description}${
          r.resolution ? ` (조치/결과: ${r.resolution})` : ''
        }`
    )
    .join('\n');
  return `다음은 "${ctx.customerName}" 고객의 ${ctx.monthLabel} IT 지원 기록입니다. 이 내용을 바탕으로 고객에게 이메일로 보낼 정중하고 전문적인 월간 리포트 본문을 작성해주세요. 인도네시아어를 먼저 쓰고, 그 아래에 한국어 번역을 붙여주세요. 장애처리 건수와 정기점검 건수를 요약하고 주요 내용을 간결하게 정리해주세요. 이메일 본문만 작성하고 제목은 별도로 붙이지 마세요.

기록:
${lines || '(이번 달 기록 없음)'}`;
}

function buildTemplateDraft(ctx: ReportContext): string {
  const incidents = ctx.records.filter((r) => r.type === 'incident');
  const inspections = ctx.records.filter((r) => r.type === 'inspection');
  const lines = ctx.records
    .map(
      (r) =>
        `- ${r.occurred_date} [${r.type === 'incident' ? '장애처리' : '정기점검'}] ${r.title}\n  내용: ${r.description}${
          r.resolution ? `\n  조치/결과: ${r.resolution}` : ''
        }`
    )
    .join('\n\n');
  return `안녕하세요, ${ctx.customerName} 담당자님.

${ctx.monthLabel} 서비스 지원 내역을 안내드립니다.

- 장애처리: ${incidents.length}건
- 정기점검: ${inspections.length}건

[상세 내역]
${lines || '이번 달 기록된 장애처리/정기점검 건이 없습니다.'}

감사합니다.
BCT Total IT Care`;
}

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/** Draft a monthly report body. Uses Claude if ANTHROPIC_API_KEY is set,
 * else OpenAI if OPENAI_API_KEY is set, else falls back to a plain
 * template — so the feature is fully usable today and upgrades seamlessly
 * once an AI key is configured, no code change needed. */
export async function generateReportDraft(
  ctx: ReportContext
): Promise<{ draft: string; source: ReportDraftSource }> {
  if (process.env.ANTHROPIC_API_KEY) {
    return { draft: await callAnthropic(buildPrompt(ctx)), source: 'anthropic' };
  }
  if (process.env.OPENAI_API_KEY) {
    return { draft: await callOpenAI(buildPrompt(ctx)), source: 'openai' };
  }
  return { draft: buildTemplateDraft(ctx), source: 'template' };
}
