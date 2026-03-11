import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE_NAME } from '@/utils';

const DEFAULT_SERVER_API_URL = 'http://127.0.0.1:5607/api/v1';

function normalizeApiBaseUrl(value: string): string {
  return value.replace('://0.0.0.0', '://127.0.0.1').replace(/\/$/, '');
}

function resolveServerApiUrl(value: string): string {
  if (!value || value.startsWith('/')) {
    return DEFAULT_SERVER_API_URL;
  }

  return value;
}

function buildHostDockerInternalFallback(urlValue: string): string | null {
  try {
    const parsed = new URL(urlValue);
    if (!['127.0.0.1', 'localhost', '0.0.0.0'].includes(parsed.hostname)) {
      return null;
    }

    parsed.hostname = 'host.docker.internal';
    return normalizeApiBaseUrl(parsed.toString());
  } catch {
    return null;
  }
}

function getServerApiBaseUrl(): { primary: string; fallback: string | null } {
  const configuredUrl = resolveServerApiUrl(
    process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_SERVER_API_URL,
  );
  const primary = normalizeApiBaseUrl(configuredUrl);

  // If SERVER_API_URL is explicitly set, trust it and skip implicit fallback routing.
  const fallback = process.env.SERVER_API_URL ? null : buildHostDockerInternalFallback(primary);
  return {
    primary,
    fallback: fallback && fallback !== primary ? fallback : null,
  };
}

export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

export async function fetchServerApi(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { primary, fallback } = getServerApiBaseUrl();
  const token = await getServerAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const performFetch = async (baseUrl: string): Promise<Response> => {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  };

  try {
    return await performFetch(primary);
  } catch {
    if (fallback) {
      try {
        return await performFetch(fallback);
      } catch {
        // fall through to graceful 503 response below.
      }
    }

    // Keep SSR resilient when backend is unavailable (e.g. frontend-only container startup).
    return new Response(
      JSON.stringify({ detail: 'Upstream API unavailable' }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

export async function fetchServerJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  try {
    const response = await fetchServerApi(path, init);
    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}
