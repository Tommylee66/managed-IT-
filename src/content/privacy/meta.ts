/** Shown on the policy page and cited in the notice itself. The body lives in
 * the per-locale markdown files beside this — only this date and version are
 * shared across all three, since they describe the document, not its wording.
 *
 * Bump both together when the text changes, and announce the change before
 * the new date takes effect (see the policy's own closing section). */
export const PRIVACY_POLICY_VERSION = '1.0';

/** TODO: set once legal review is done. Until then the page says the policy
 * is a draft rather than showing a date that is not yet true. */
export const PRIVACY_POLICY_EFFECTIVE_DATE: string | null = null;
