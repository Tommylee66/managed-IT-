import type { AssetType } from '@/types/domain';

/** Bilingual (id/ko) category labels for customer-facing documents, which
 * always render id-primary/ko-secondary regardless of the viewer's own
 * locale — separate from the `equipmentCategory` next-intl namespace used
 * in the staff-facing admin UI (ko/id/en, locale-aware). */
export const EQUIPMENT_CATEGORY_LABEL: Record<AssetType, { id: string; ko: string }> = {
  router: { id: 'Router', ko: '라우터' },
  ap: { id: 'Access Point', ko: 'AP(무선망)' },
  hub_switch: { id: 'Hub/Switch', ko: '허브/스위치' },
  cctv: { id: 'CCTV', ko: 'CCTV' },
  security: { id: 'Perangkat Keamanan', ko: '보안장비' },
  vpn_config: { id: 'Konfigurasi VPN', ko: 'VPN 구성' },
  starlink: { id: 'Starlink', ko: 'Starlink' },
  pc_server: { id: 'PC/Server', ko: 'PC/서버' },
  printer: { id: 'Printer', ko: '프린터' },
  other: { id: 'Lainnya', ko: '기타' },
};
