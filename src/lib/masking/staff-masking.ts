/**
 * Field masking for the `staff` role. Techniques mirror
 * ai-pajak's src/lib/admin/data-masking.ts (partial reveal, bucketing,
 * full redaction) — applied here to different fields, since `staff` is
 * the restricted viewer and `master` sees everything unmasked.
 *
 * Applied in the data-access layer (src/lib/data-access/*.ts), never in
 * components — every read for a table with sensitive fields goes through
 * one of these before reaching a `staff`-role caller.
 */

// Re-exported so every masking check (`role === 'master'`) automatically
// covers all non-master tiers — see the type's own doc comment in domain.ts.
export type { StaffRole } from '@/types/domain';

/** Tax ID (NPWP/NIB): staff sees only the last 4 digits, to visually
 * confirm against physical documents without seeing the full number. */
export function maskTaxId(taxId: string | null): string {
  if (!taxId) return '';
  const digits = taxId.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '****...' + digits.slice(-4);
}

/** Reused verbatim from ai-pajak's maskPhoneNumber. */
export function maskPhoneNumber(phone: string | null): string {
  if (!phone || phone.length < 4) return '***';
  const countryCode = phone.substring(0, 3);
  const lastTwo = phone.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(phone.length - 5, 0));
  return countryCode + maskedMiddle + lastTwo;
}

/** Reused verbatim from ai-pajak's maskEmail. */
export function maskEmail(email: string | null): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return '**@' + domain;
  return localPart.substring(0, 2) + '***@' + domain;
}

/** Reused verbatim from ai-pajak's maskCustomerName, used for bank holder names. */
export function maskName(name: string | null): string {
  if (!name) return '***';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0) + '.';
  return parts.map((p) => p.charAt(0) + '.').join(' ');
}

export interface BankInfo {
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
}

/** Bank name stays visible (needed to route a payment), account number
 * shows only the last 4 digits, holder name reduces to initials. */
export function maskBankAccount(bank: BankInfo | null): BankInfo | null {
  if (!bank) return null;
  return {
    bankName: bank.bankName,
    accountNumber: bank.accountNumber ? '****' + bank.accountNumber.slice(-4) : undefined,
    holderName: bank.holderName ? maskName(bank.holderName) : undefined,
  };
}

/** Reused from ai-pajak's bucketAmount, applied to cost/margin-revealing figures. */
export function bucketAmount(amount: number): string {
  if (amount < 0) return 'Invalid';
  if (amount === 0) return '0';
  if (amount < 1_000_000) return '< 1M';
  if (amount < 5_000_000) return '1M - 5M';
  if (amount < 10_000_000) return '5M - 10M';
  if (amount < 50_000_000) return '10M - 50M';
  return '> 50M';
}

/** Margin % bucketed rather than shown exactly — reveals less about pricing strategy. */
export function bucketMargin(marginPercent: number): string {
  if (marginPercent < 0) return '< 0%';
  if (marginPercent < 10) return '0-10%';
  if (marginPercent < 20) return '10-20%';
  if (marginPercent < 30) return '20-30%';
  if (marginPercent < 40) return '30-40%';
  return '> 40%';
}

/** Agent commission figures are hidden entirely for staff — even a bucket
 * would reveal a colleague's pay scale, which bucketing doesn't solve. */
export function hideCommission(): string {
  return '***';
}

const MAC_OR_IP_RE = /([0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5})|(\b\d{1,3}(\.\d{1,3}){3}\b)/g;

/** Multi-line asset serial fields often carry MAC/IP on later lines —
 * redact only those tokens, keep model/asset-tag lines fully visible. */
export function maskSerial(serial: string | null): string {
  if (!serial) return '';
  return serial
    .split('\n')
    .map((line) => (MAC_OR_IP_RE.test(line) ? line.replace(MAC_OR_IP_RE, '[hidden]') : line))
    .join('\n');
}

/** Strip the entire cost-basis config from a `rates` row for staff —
 * the calculated customer-facing price stays, the internal cost doesn't. */
export function stripCostFields<T extends { costFields?: unknown; initFields?: unknown }>(
  rates: T
): Omit<T, 'costFields' | 'initFields'> {
  const rest = { ...rates };
  delete rest.costFields;
  delete rest.initFields;
  return rest;
}

/** Build-time/test safety net, mirrors ai-pajak's validateMaskedData(). */
export function assertNoRawSensitiveFields(data: unknown, sensitiveKeys: string[]): void {
  function check(obj: unknown, path = ''): void {
    if (typeof obj !== 'object' || obj === null) return;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (sensitiveKeys.includes(key)) {
        throw new Error(`Unmasked sensitive field leaked to staff view: ${currentPath}`);
      }
      if (typeof value === 'object') check(value, currentPath);
    }
  }
  check(data);
}
