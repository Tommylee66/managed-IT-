export const APP_NAME = 'BCT Total IT Care';

export const LOCALES = ['ko', 'id', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  ko: '한국어',
  id: 'Bahasa Indonesia',
  en: 'English',
};

export const DEFAULT_LOCALE: Locale = 'id';
