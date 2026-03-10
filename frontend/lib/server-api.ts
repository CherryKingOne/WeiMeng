import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE_NAME } from '@/utils';

const DEFAULT_SERVER_API_URL = 'http://127.0.0.1:5607/api/v1';

function normalizeApiBaseUrl(value: string): string {
  return value.replace('://0.0.0.0', '://127.0.0.1').replace(/\/$/, '');
}

function getServerApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || DEFAULT_SERVER_API_URL);
}

export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

export async function fetchServerApi(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getServerAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${getServerApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export async function fetchServerJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const response = await fetchServerApi(path, init);
  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<T>;
}
