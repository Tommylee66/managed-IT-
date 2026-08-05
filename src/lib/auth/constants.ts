/** Enforced in both the staff-creation flow (create-staff-account.ts) and the
 * role-change API route — kept as a single shared constant since it's a
 * client-safe primitive (no node-only imports), unlike the modules that
 * enforce it. */
export const MAX_MASTER_ACCOUNTS = 2;
