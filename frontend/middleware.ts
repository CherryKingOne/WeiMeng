import { NextRequest, NextResponse } from 'next/server';
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  detectLocaleFromAcceptLanguage,
  extractLocaleFromPath,
  isLocale,
  withLocale,
} from '@/constants';

function resolveLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerLocale = detectLocaleFromAcceptLanguage(request.headers.get('accept-language'));
  return headerLocale || DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLocale = extractLocaleFromPath(pathname);

  if (pathnameLocale) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  const locale = resolveLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = withLocale(pathname, locale);

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
