import ExcelJS from 'exceljs';

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
}

/** Shared helper for any download route that needs an .xlsx file instead of
 * a plain CSV — bold header row, sensible column widths, numbers stored as
 * real numbers (not text) so totals/sums work directly in Excel. */
export async function buildXlsxBuffer(
  sheetName: string,
  columns: XlsxColumn[],
  rows: Record<string, string | number | null>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
