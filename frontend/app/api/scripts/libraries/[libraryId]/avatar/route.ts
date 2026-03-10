import { fetchServerApi } from '@/lib/server-api';

type RouteContext = {
  params: Promise<{
    libraryId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { libraryId } = await context.params;
  const upstream = await fetchServerApi(`/scripts/libraries/${libraryId}/avatar`);

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=86400',
    },
  });
}
