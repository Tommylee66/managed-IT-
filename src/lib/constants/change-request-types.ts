/** `value` is the literal string stored in change_requests.type (a DB-level
 * enum-like value, not itself locale-specific — see application-sources.ts
 * for the identical pattern). `key` looks up the display label in the
 * changeRequests i18n namespace. Shared between the create form (which
 * writes `value`) and any list/detail view that needs to translate a
 * stored `value` back into a label. */
export const CHANGE_REQUEST_TYPE_OPTIONS = [
  { value: '장비 추가', key: 'typeEquipmentAdd' },
  { value: '장비 삭제', key: 'typeEquipmentRemove' },
  { value: '서비스 변경', key: 'typeServiceChange' },
  { value: '요금 변경', key: 'typeFeeChange' },
  { value: '로케이션 변경', key: 'typeLocationChange' },
  { value: '기타', key: 'typeOther' },
] as const;

export function changeRequestTypeKey(value: string | null | undefined): string | undefined {
  return CHANGE_REQUEST_TYPE_OPTIONS.find((o) => o.value === value)?.key;
}
