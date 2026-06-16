import { NextRequest, NextResponse } from 'next/server';
import { Channel } from '@/types/channel';

const COUNTRY_PLAYLISTS: Record<string, string> = {
  bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
  in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
  ar: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
};

function parseM3U(content: string, country: string): Channel[] {
  const lines = content.split('\n').map((l) => l.trim());
  const channels: Channel[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF:')) continue;

    // Extract attributes from #EXTINF line
    const nameMatch = line.match(/,(.+)$/);
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupMatch = line.match(/group-title="([^"]*)"/);
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);

    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
    const logo = logoMatch ? logoMatch[1] : '';
    const group = groupMatch ? groupMatch[1] : 'General';
    const tvgId = tvgIdMatch ? tvgIdMatch[1] : '';
    const tvgName = tvgNameMatch ? tvgNameMatch[1] : '';

    // Next non-empty line is the stream URL
    let url = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] && !lines[j].startsWith('#')) {
        url = lines[j];
        break;
      }
    }

    if (!url) continue;

    const id = `${country}-${i}-${Buffer.from(name).toString('base64').slice(0, 8)}`;

    channels.push({ id, name, logo, group, url, country, tvgId, tvgName });
  }

  return channels;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.toLowerCase() || 'bd';

  // Validate country param
  if (!COUNTRY_PLAYLISTS[country]) {
    return NextResponse.json(
      { error: `Unsupported country code: ${country}. Use bd, in, or ar.` },
      { status: 400 }
    );
  }

  try {
    const playlistUrl = COUNTRY_PLAYLISTS[country];
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LiveTV/1.0)',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }

    const content = await response.text();
    const channels = parseM3U(content, country);

    return NextResponse.json(
      { channels, total: channels.length, country },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch or parse playlist', details: message },
      { status: 500 }
    );
  }
}
