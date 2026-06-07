/**
 * Email allowlist for `public.users.role = 'admin'`.
 * Set in `.env.local`:
 *   NEXT_PUBLIC_ADMIN_EMAILS=admin@school.edu,other@school.edu
 *
 * Matching is case-insensitive. Values are synced on profile upsert / auth hydration.
 *
 * Note: `NEXT_PUBLIC_*` is exposed to the browser. For high-security deployments, promote
 * admins via SQL or a server-only mechanism instead.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((s) => normalizeEmail(s))
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = getAdminEmailAllowlist()
  if (allow.length === 0) return false
  return allow.includes(normalizeEmail(email))
}
