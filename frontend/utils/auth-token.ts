import { removeStorageItem, setStorageItem } from './storage';

export const AUTH_TOKEN_COOKIE_NAME = 'wm_access_token';
const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function buildCookieAttributes(maxAgeSeconds: number): string {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function setAuthToken(token: string): void {
  setStorageItem('token', token);

  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; ${buildCookieAttributes(AUTH_TOKEN_MAX_AGE_SECONDS)}`;
}

export function clearAuthToken(): void {
  removeStorageItem('token');

  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; ${buildCookieAttributes(0)}`;
}

export function syncAuthTokenCookie(token: string | null): void {
  if (!token) {
    return;
  }

  if (typeof document === 'undefined') {
    return;
  }

  const encodedToken = encodeURIComponent(token);
  if (document.cookie.includes(`${AUTH_TOKEN_COOKIE_NAME}=${encodedToken}`)) {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodedToken}; ${buildCookieAttributes(AUTH_TOKEN_MAX_AGE_SECONDS)}`;
}
