/** One-time settlement for a mid-cycle service change: the fee difference
 * applied only to the days remaining in the effective month, since the new
 * monthly rate itself takes over starting next month's invoice. */
export function calcProratedSettlement(effectiveDate: string, monthlyDiff: number): number {
  const date = new Date(`${effectiveDate}T00:00:00`);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - date.getDate() + 1;
  return Math.round((monthlyDiff * remainingDays) / daysInMonth);
}
