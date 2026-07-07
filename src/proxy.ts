import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/config/constants';

const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

const PROTECTED_PREFIXES = ['/dashboard', '/customers', '/agents', '/applications', '/quotes', '/contracts', '/activations', '/assets', '/change-requests', '/invoices', '/termination', '/service-logs', '/admin'];
const AUTH_ROUTES = ['/login'];

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // next-intl issues a redirect when the URL is missing/has an invalid
  // locale prefix (e.g. a bare "/"). Let that resolve first — the auth
  // check below runs again on the follow-up request once the URL has a
  // real locale segment.
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;
  const segments = pathname.split('/');
  const locale = LOCALES.includes(segments[1] as Locale) ? segments[1] : DEFAULT_LOCALE;
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  const isProtectedRoute = PROTECTED_PREFIXES.some((route) => pathWithoutLocale.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathWithoutLocale.startsWith(route));

  if (!isProtectedRoute && !isAuthRoute) {
    return intlResponse;
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (isProtectedRoute && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Carry over next-intl's own cookies (e.g. NEXT_LOCALE) onto the Supabase
  // response so switching locale doesn't get silently dropped by returning
  // only one of the two middleware's responses.
  intlResponse.cookies.getAll().forEach((cookie) => supabaseResponse.cookies.set(cookie));
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
