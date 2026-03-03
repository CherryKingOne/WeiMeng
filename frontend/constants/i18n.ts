export const SUPPORTED_LOCALES = ['zh', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_COOKIE = 'weimeng_locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function extractLocaleFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : undefined;
}

export function getLocaleFromPath(pathname: string): Locale {
  return extractLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
}

export function stripLocaleFromPath(pathname: string): string {
  const locale = extractLocaleFromPath(pathname);
  if (!locale) {
    return pathname || '/';
  }

  const withoutLocale = pathname.slice(`/${locale}`.length);
  return withoutLocale || '/';
}

export function withLocale(pathname: string, locale: Locale): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const noLocalePath = stripLocaleFromPath(normalized);
  return noLocalePath === '/' ? `/${locale}` : `/${locale}${noLocalePath}`;
}

export function detectLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const normalized = header.toLowerCase();
  if (normalized.includes('zh')) {
    return 'zh';
  }
  if (normalized.includes('en')) {
    return 'en';
  }

  return DEFAULT_LOCALE;
}
