import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { canAccessPath } from "@/lib/auth/permissions";
import { generateDocumentPdf } from "@/lib/pdf/generate-document-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only these exact print-route shapes may be rendered to PDF, so the `path`
// query param can't be used to make this endpoint fetch arbitrary URLs.
const ALLOWED_PATH_PATTERN =
  /^\/(ko|id|en)\/(quotes|contracts|invoices|termination)\/[^/?]+\/print(\?[^/]*)?$|^\/(ko|id|en)\/incident-logs\/report\/print(\?[^/]*)?$|^\/(ko|id|en)\/agents\/[^/?]+\/agreement\/print(\?[^/]*)?$/;

export async function GET(req: NextRequest) {
  const session = await getSessionContext();
  if (!session || !session.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path || !ALLOWED_PATH_PATTERN.test(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // proxy.ts's matcher excludes /api, so the middleware's role-based path
  // gating never runs here — this route has to repeat it, the same way
  // /api/invoices/export does. Without it, being an active staff member is
  // enough to pull any document in ALLOWED_PATH_PATTERN, including ones the
  // caller's menu blocks: the agent agreement carries that agent's bank
  // account, NPWP and commission rate, and `agents` is not one of the
  // tables RLS scopes per sales_agent, so row access wouldn't stop it
  // either. The print pages themselves render unmasked (role "master")
  // on purpose, which leaves this the only check standing.
  const pathWithoutLocale = path.split("?")[0].replace(/^\/(ko|id|en)/, "");
  if (!canAccessPath(session.role, pathWithoutLocale)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(path, req.nextUrl.origin).toString();
  const cookies = req.cookies.getAll().map((c) => ({
    name: c.name,
    value: c.value,
    domain: req.nextUrl.hostname,
  }));

  try {
    const pdf = await generateDocumentPdf(url, cookies);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
