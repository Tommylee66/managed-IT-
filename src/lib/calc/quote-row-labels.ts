import type { QuoteRowRecord } from '@/types/domain';
import type { Locale } from '@/config/constants';

export const QUOTE_ROW_LABELS: Record<string, Record<Locale, string>> = {
  base: {
    ko: 'Managed IT 기본 서비스',
    id: 'Layanan Dasar Managed IT',
    en: 'Managed IT Base Service',
  },
  term: {
    ko: '24개월 계약 추가요금',
    id: 'Biaya tambahan kontrak 24 bulan',
    en: '24-month contract add-on fee',
  },
  employeeExtra: {
    ko: '직원/PC 추가 {emp}명',
    id: 'Tambahan {emp} karyawan/PC',
    en: 'Additional {emp} employees/PCs',
  },
  apExtra: {
    ko: 'AP 추가 {ap}대',
    id: 'Tambahan {ap} unit AP',
    en: 'Additional {ap} AP units',
  },
  hubExtra: {
    ko: '허브/스위치 추가 {hub}대',
    id: 'Tambahan {hub} unit hub/switch',
    en: 'Additional {hub} hub/switch units',
  },
  cctvExtra: {
    ko: 'CCTV 유지보수 추가 {cctvExtra}대',
    id: 'Tambahan pemeliharaan {cctvExtra} unit CCTV',
    en: 'Additional CCTV maintenance for {cctvExtra} units',
  },
  visitTwice: {
    ko: '월 2회 방문점검 추가',
    id: 'Tambahan kunjungan pemeriksaan 2x/bulan',
    en: 'Twice-monthly visit inspection add-on',
  },
  visitOnceCost: {
    ko: '월 1회 방문점검 원가 반영',
    id: 'Biaya kunjungan pemeriksaan 1x/bulan (internal)',
    en: 'Monthly visit inspection cost (internal)',
  },
  location: {
    ko: '로케이션: {name}',
    id: 'Lokasi: {name}',
    en: 'Location: {name}',
  },
  priority: {
    ko: '우선 장애대응',
    id: 'Respons gangguan prioritas',
    en: 'Priority incident response',
  },
  vpnBase: {
    ko: 'Managed VPN 기본',
    id: 'Managed VPN dasar',
    en: 'Managed VPN base',
  },
  vpnBranchExtra: {
    ko: 'VPN 추가 지점 {branches}곳',
    id: 'Tambahan {branches} cabang VPN',
    en: 'Additional VPN branches: {branches}',
  },
  securityMonitor: {
    ko: '고객 보유 보안장비 관제',
    id: 'Pemantauan perangkat keamanan milik pelanggan',
    en: 'Monitoring of customer-owned security devices',
  },
  securityDevice: {
    ko: 'FortiGate 등 보안장비 제공+관제',
    id: 'Penyediaan+pemantauan perangkat keamanan (FortiGate, dll.)',
    en: 'Security device provision + monitoring (FortiGate, etc.)',
  },
  discount: {
    ko: '할인/조정액',
    id: 'Diskon/penyesuaian',
    en: 'Discount/adjustment',
  },
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}

type LabelSource = Pick<QuoteRowRecord, 'label' | 'labelKey' | 'params' | 'labelId' | 'labelKo'>;

/** Renders a quote row's label in the given locale. Catalog-sourced rows
 * (labelId/labelKo) win over a fixed QUOTE_ROW_LABELS entry, which in turn
 * wins over the stored (Korean) `label` for rows saved before either existed.
 * English has no separate catalog variant, so it falls back to the
 * Indonesian text — same convention as equipment_catalog's spec_id/spec_ko. */
export function renderQuoteRowLabel(row: LabelSource, locale: Locale): string {
  if (row.labelId || row.labelKo) return (locale === 'ko' ? row.labelKo : row.labelId) ?? row.label;
  const entry = row.labelKey ? QUOTE_ROW_LABELS[row.labelKey] : undefined;
  if (!entry) return row.label;
  return interpolate(entry[locale], row.params);
}

/** Renders a quote row's label in both Indonesian and Korean, for the
 * permanent bilingual customer-facing quote document. */
export function renderBilingualQuoteRowLabel(row: LabelSource): { id: string; ko: string } {
  if (row.labelId || row.labelKo) {
    return { id: row.labelId ?? row.label, ko: row.labelKo ?? row.label };
  }
  const entry = row.labelKey ? QUOTE_ROW_LABELS[row.labelKey] : undefined;
  if (!entry) return { id: row.label, ko: row.label };
  return { id: interpolate(entry.id, row.params), ko: interpolate(entry.ko, row.params) };
}
