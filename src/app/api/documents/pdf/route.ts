import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { canAccessPath } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { generateDocumentPdf } from "@/lib/pdf/generate-document-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only these exact print-route shapes may be rendered to PDF, so the `path`
// query param can't be used to make this endpoint fetch arbitrary URLs.
const ALLOWED_PATH_PATTERN =
  /^\/(ko|id|en)\/(quotes|contracts|invoices|termination)\/[^/?]+\/print(\?[^/]*)?$|^\/(ko|id|en)\/incident-logs\/report\/print(\?[^/]*)?$|^\/(ko|id|en)\/agents\/[^/?]+\/agreement\/print(\?[^/]*)?$/;

const PDF_STREAM_CHUNK_SIZE = 64 * 1024;

function streamPdf(pdf: Buffer): ReadableStream<Uint8Array> {
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= pdf.length) {
        controller.close();
        return;
      }

      const end = Math.min(offset + PDF_STREAM_CHUNK_SIZE, pdf.length);
      controller.enqueue(Uint8Array.from(pdf.subarray(offset, end)));
      offset = end;
    },
    cancel() {
      offset = pdf.length;
    },
  });
}

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

    // A PDF leaves the system with a person's data in it (an agreement
    // carries an agent's bank account; an invoice, a customer's billing
    // contact). UU PDP art. 46 gives 3x24 hours to tell people what was
    // exposed in a breach, which is unanswerable without a record of who
    // took what out. Logged after the render so a failed generation isn't
    // recorded as an export, and awaited so the log can't be lost with the
    // response — this is the audit trail, not telemetry.
    const supabase = await createClient();
    const { error: auditError } = await supabase.rpc("log_audit", {
      p_action: "DOCUMENT_EXPORTED",
      p_target_table: null,
      p_target_id: pathWithoutLocale,
      p_details: { role: session.role, bytes: pdf.length },
    });
    if (auditError) {
      console.error("audit log failed for document export", auditError);
    }

    // Vercel rejects buffered Function responses larger than 4.5 MB. Korean
    // web-font subsets embedded by Chromium can push otherwise small legal
    // documents over that limit. Stream the completed PDF in bounded chunks
    // so the platform never treats it as one oversized response payload.
    return new Response(streamPdf(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="document.pdf"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
