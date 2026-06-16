import { NextRequest, NextResponse } from 'next/server';

// Maximum size for buffered responses (e.g., m3u8 manifests) - 10 MB
const MAX_BUFFER_SIZE = 10 * 1024 * 1024;

const PROXY_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  Connection: 'keep-alive',
};

function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
    return relativeOrAbsolute;
  }
  const base = new URL(baseUrl);
  if (relativeOrAbsolute.startsWith('/')) {
    return `${base.protocol}//${base.host}${relativeOrAbsolute}`;
  }
  // Relative path — resolve against directory of baseUrl
  const dir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  return dir + relativeOrAbsolute;
}

function rewriteM3U8(content: string, originalUrl: string): string {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      // Skip empty lines, comments that are not URI tags
      if (!trimmed || trimmed.startsWith('#EXT')) {
        // Rewrite URI= attribute inside EXT tags (e.g., #EXT-X-KEY:URI="...")
        return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
          const abs = resolveUrl(uri, originalUrl);
          return `URI="/api/proxy?url=${encodeURIComponent(abs)}"`;
        });
      }
      if (trimmed.startsWith('#')) return line;

      // It's a segment/playlist URL — rewrite it
      const abs = resolveUrl(trimmed, originalUrl);
      return `/api/proxy?url=${encodeURIComponent(abs)}`;
    })
    .join('\n');
}

function isM3U8(url: string, contentType: string): boolean {
  return (
    contentType.includes('mpegurl') ||
    contentType.includes('x-mpegurl') ||
    url.toLowerCase().includes('.m3u8') ||
    url.toLowerCase().includes('m3u8')
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const fetchHeaders: Record<string, string> = {
      ...PROXY_HEADERS,
      Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
      Origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
    };

    const upstreamRes = await fetch(targetUrl, {
      headers: fetchHeaders,
      // Don't cache at the fetch level — we handle caching per content type
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstreamRes.status} ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || '';

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    // ── M3U8 manifest: buffer + rewrite segment URLs ──────────────────────────
    if (isM3U8(targetUrl, contentType)) {
      const text = await upstreamRes.text();
      const rewritten = rewriteM3U8(text, targetUrl);

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store',
          ...corsHeaders,
        },
      });
    }

    // ── Binary segments (TS, AAC, MP4, etc.): stream directly ─────────────────
    // Check content-length to avoid buffering huge responses
    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BUFFER_SIZE) {
      return NextResponse.json({ error: 'Response too large to proxy' }, { status: 413 });
    }

    // Pipe the body stream directly — most memory-efficient approach
    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'video/mp2t',
        'Cache-Control': 'public, max-age=30',
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        ...corsHeaders,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Proxy request failed', details: message },
      { status: 500 }
    );
  }
}

// Handle preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
