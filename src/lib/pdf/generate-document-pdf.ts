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
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "20mm", left: "15mm", right: "15mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:9px;color:#666;font-family:Arial,sans-serif;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
