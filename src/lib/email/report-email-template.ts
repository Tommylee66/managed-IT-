function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wraps the (AI- or template-generated) plain-text report body in a
 * branded HTML email — same letterhead look as the printed documents
 * (DocumentShell), so the report reads as a professional communication
 * rather than a bare text dump. Body text is escaped and paragraph breaks
 * (blank lines) become <p> tags, single line breaks become <br>. */
export function buildReportEmailHtml(params: {
  customerName: string;
  monthLabel: string;
  bodyText: string;
}): string {
  const { customerName, monthLabel, bodyText } = params;
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => escapeHtml(p.trim()).replace(/\n/g, '<br />'))
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;">${p}</p>`)
    .join('\n');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="height:6px;background-image:linear-gradient(135deg,#0f5f8f,#11a3b7);"></td>
            </tr>
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:56px;height:56px;border-radius:14px;background-image:linear-gradient(135deg,#0f5f8f,#11a3b7);text-align:center;vertical-align:middle;">
                      <span style="color:#ffffff;font-weight:800;font-size:14px;">BCT</span>
                    </td>
                    <td style="padding-left:16px;">
                      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;">
                        PT. Bumi Cerdas Teknology &middot; Managed IT Services
                      </div>
                      <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:2px;">
                        ${escapeHtml(monthLabel)} 서비스 리포트
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;font-size:14px;color:#475569;">
                ${escapeHtml(customerName)} 담당자님께,
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;font-size:14px;line-height:1.7;color:#1e293b;">
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
                PT. Bumi Cerdas Teknology — Managed IT Services
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
