import type { StaffRole } from '@/types/domain';

/** Every protected route prefix in the app (mirrors proxy.ts's
 * PROTECTED_PREFIXES, plus /admin's sub-paths broken out individually since
 * they have different per-role access). */
const ALL_ROLE_PATHS = [
  '/dashboard',
  '/customers',
  '/agents',
  '/applications',
  '/quotes',
  '/contracts',
  '/activations',
  '/assets',
  '/change-requests',
  '/invoices',
  '/termination',
  '/service-logs',
  '/incident-logs',
  '/admin/staff',
  '/admin/rates',
  '/admin/audit-log',
  '/admin/approvals',
];

/** Which route prefixes each role may enter. Enforced centrally in
 * proxy.ts (middleware) rather than per-page, so a new page only needs to
 * be added here once instead of gaining its own inline redirect check. */
export const ROLE_PATHS: Record<StaffRole, string[]> = {
  master: ALL_ROLE_PATHS,
  // Everything except rates (요율설정), activations (개통), and the new
  // incident-logs (장애처리 및 정기점검) menu.
  admin_dept: ALL_ROLE_PATHS.filter(
    (p) => !['/admin/rates', '/activations', '/incident-logs'].includes(p)
  ),
  // 조회(customer lookup) + 개통 + 장애처리 및 정기점검 only.
  activation_dept: ['/dashboard', '/customers', '/activations', '/incident-logs'],
  // 고객/등록, 조회, 신규신청(견적작업), 계약, 변경 요청 only.
  sales_agent: ['/dashboard', '/customers', '/quotes', '/contracts', '/change-requests'],
};

export function canAccessPath(role: StaffRole, pathname: string): boolean {
  const allowed = ROLE_PATHS[role];
  if (!allowed) return false;
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
