/** Bilingual (Indonesian + Korean) label for a "YYYY-MM" month key — matches
 * the convention of every other customer-facing document/communication in
 * this app (ID primary, KO secondary), and is used both in the monthly
 * report email and its printable version so the two stay consistent. */
export function bilingualMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const id = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  const ko = `${year}년 ${Number(month)}월`;
  return `${id} (${ko})`;
}
