/** `value` is the literal string stored in applications.source (a DB-level
 * enum-like value, not itself locale-specific). `key` looks up the display
 * label in the applications i18n namespace. Shared between the create form
 * (which writes `value`) and any list/detail view that needs to translate a
 * stored `value` back into a label. */
export const APPLICATION_SOURCE_OPTIONS = [
  { value: '신규 직접입력', key: 'sourceNewDirect' },
  { value: '고객 소개', key: 'sourceReferral' },
  { value: '영업사원 접수', key: 'sourceAgentIntake' },
  { value: '기존 고객 추가신청', key: 'sourceExistingCustomerAddon' },
] as const;

export function applicationSourceKey(value: string | null | undefined): string | undefined {
  return APPLICATION_SOURCE_OPTIONS.find((o) => o.value === value)?.key;
}
