const DEFAULT_SERVER_API_URL = 'http://127.0.0.1:5607/api/v1';
const PROXY_ERROR_RESPONSE = JSON.stringify({ detail: 'Upstream API unavailable' });
const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function normalizeBaseUrl(value: string): string {
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
    return normalizeBaseUrl(parsed.toString());
  } catch {
    return null;
  }
}

function getServerApiBaseUrl(): { primary: string; fallback: string | null } {
  const configured = resolveServerApiUrl(
    process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_SERVER_API_URL,
  );
  const primary = normalizeBaseUrl(configured);
  const fallback = process.env.SERVER_API_URL ? null : buildHostDockerInternalFallback(primary);

  return {
    primary,
    fallback: fallback && fallback !== primary ? fallback : null,
  };
}

function buildUpstreamPath(requestUrl: string, pathSegments: string[]): string {
  const request = new URL(requestUrl);
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  const query = request.search || '';
  return `/${encodedPath}${query}`;
}

function buildUpstreamHeaders(requestHeaders: Headers): Headers {
  const headers = new Headers(requestHeaders);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  return headers;
}

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const { primary, fallback } = getServerApiBaseUrl();
  const targetPath = buildUpstreamPath(request.url, path);
  const headers = buildUpstreamHeaders(request.headers);
  const hasBody = !METHODS_WITHOUT_BODY.has(request.method);
  const requestBody = hasBody ? await request.arrayBuffer() : undefined;

  const doFetch = async (baseUrl: string): Promise<Response> => {
    const targetUrl = `${baseUrl}${targetPath}`;
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  };

  try {
    return await doFetch(primary);
  } catch {
    if (fallback) {
      try {
        return await doFetch(fallback);
      } catch {
        // Continue to 503 below.
      }
    }

    return new Response(PROXY_ERROR_RESPONSE, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function HEAD(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext): Promise<Response> {
  return proxy(request, context);
}
