import puppeteer, { type Browser } from "puppeteer-core";

const LOCAL_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function launchBrowser(): Promise<Browser> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    // @sparticuz/chromium's default args include --single-process, which
    // breaks Chromium's print compositor: page.pdf() silently renders the
    // whole document as one continuous page instead of paginating it. Local
    // Chrome doesn't use this flag, which is why this only showed up in
    // production.
    const args = chromium.args.filter((arg) => arg !== "--single-process");
    return puppeteer.launch({
      args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Promise<Browser>;
  }

  return puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || LOCAL_CHROME_PATH,
    headless: true,
  }) as unknown as Promise<Browser>;
}

export interface DocumentPdfCookie {
  name: string;
  value: string;
  domain: string;
}

export async function generateDocumentPdf(url: string, cookies: DocumentPdfCookie[]): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }
    await page.goto(url, { waitUntil: "networkidle0" });
    // headerTemplate/footerTemplate render in an isolated context (no access
    // to the page's own Tailwind CSS) and span the FULL page width regardless
    // of margin.left/right, so they're padded here to line up with the
    // content margins below. DocumentShell's own logo/letterhead only renders
    // once at the top of the whole flowing document, so without this,
    // continuation pages have no branding at all — this repeats a compact
    // version of it (accent bar + letterhead line, thin rule + page number)
    // on every page.
    //
    // margin must match the `@page { margin }` rule in globals.css — a page
    // that starts via a forced break (a break-inside:avoid li/tr pushed
    // whole onto the next page) reflows its content using the CSS margin,
    // not this one, so a mismatch causes content to collide with the header.
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "18mm", left: "15mm", right: "15mm" },
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="width:100%;font-family:Arial,sans-serif;padding:0 15mm;box-sizing:border-box;">' +
        '<div style="height:2px;width:100%;background:linear-gradient(135deg,#0f5f8f,#11a3b7);border-radius:2px;"></div>' +
        '<div style="margin-top:4px;font-size:8px;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;text-align:right;">' +
        "PT. Bumi Cerdas Teknology &middot; Managed IT Services</div></div>",
      footerTemplate:
        '<div style="width:100%;font-family:Arial,sans-serif;padding:0 15mm;box-sizing:border-box;text-align:center;">' +
        '<div style="height:1px;width:100%;background:#e2e8f0;margin-bottom:4px;"></div>' +
        '<div style="font-size:9px;color:#94a3b8;"><span class="pageNumber"></span> / <span class="totalPages"></span></div></div>',
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
