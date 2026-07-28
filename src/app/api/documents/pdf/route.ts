import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { generateDocumentPdf } from "@/lib/pdf/generate-document-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only these exact print-route shapes may be rendered to PDF, so the `path`
// query param can't be used to make this endpoint fetch arbitrary URLs.
const ALLOWED_PATH_PATTERN =
  /^\/(ko|id|en)\/(quotes|contracts|invoices|termination)\/[^/?]+\/print(\?[^/]*)?$|^\/(ko|id|en)\/incident-logs\/report\/print(\?[^/]*)?$/;

export async function GET(req: NextRequest) {
  const session = await getSessionContext();
  if (!session || !session.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path || !ALLOWED_PATH_PATTERN.test(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
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
    // This route already requires an authenticated staff session (checked
    // above), so surfacing the real error to the caller is safe here and
    // saves a trip through Vercel's function logs while this is debugged.
    const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
    return NextResponse.json({ error: "PDF generation failed", detail: message }, { status: 500 });
  }
}
