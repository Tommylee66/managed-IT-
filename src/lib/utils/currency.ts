import type { Locale } from '@/config/constants';

// Indonesian convention groups thousands with a period (Rp 1.500.000);
// Korean/English readers expect a comma (Rp 1,500,000) — same digits, the
// separator just follows whichever language the viewer has the UI in.
const LOCALE_TAG: Record<Locale, string> = { id: 'id-ID', ko: 'ko-KR', en: 'en-US' };

export function formatRupiah(amount: number, locale: Locale = 'id'): string {
  return 'Rp ' + Math.round(amount).toLocaleString(LOCALE_TAG[locale]);
}
