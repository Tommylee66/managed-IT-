import { addMonths, addDays, format } from 'date-fns';

// Ported 1:1 from the source app: agent earns 100% commission for the full
// contract duration, then 50% for an equal further duration (total = 1.5x).

export interface CommissionCalcResult {
  monthlyCommission: number;
  halfMonthlyCommission: number;
  commissionFullEnd: string;
  commissionHalfStart: string;
  commissionEnd: string;
  totalCommission: number;
}

export function calculateCommission(
  commissionBase: number,
  commissionRate: number,
  startDate: string,
  months: number
): CommissionCalcResult {
  const monthlyCommission = (commissionBase * commissionRate) / 100;
  const halfMonthlyCommission = monthlyCommission * 0.5;

  const start = new Date(startDate);
  const commissionFullEnd = addDays(addMonths(start, months), -1);
  const commissionHalfStart = addDays(commissionFullEnd, 1);
  const commissionEnd = addDays(addMonths(commissionHalfStart, months), -1);

  const totalCommission = monthlyCommission * months * 1.5;

  return {
    monthlyCommission,
    halfMonthlyCommission,
    commissionFullEnd: format(commissionFullEnd, 'yyyy-MM-dd'),
    commissionHalfStart: format(commissionHalfStart, 'yyyy-MM-dd'),
    commissionEnd: format(commissionEnd, 'yyyy-MM-dd'),
    totalCommission,
  };
}
