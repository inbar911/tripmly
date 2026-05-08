import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const lang = searchParams.get('lang') || 'en';
  if (!q) return NextResponse.json({ places: [] });

  const radiusDeg = 0.1;
  const viewbox = !isNaN(lat) && !isNaN(lng)
    ? `${lng - radiusDeg},${lat + radiusDeg},${lng + radiusDeg},${lat - radiusDeg}`
    : '';

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '25',
    'accept-language': lang,
    addressdetails: '1',
    extratags: '1'
  });
  if (viewbox) {
    params.set('viewbox', viewbox);
    params.set('bounded', '1');
  }

  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Tripmly/1.0 (https://tripmly.vercel.app)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return NextResponse.json({ places: [], error: `Nominatim ${r.status}` }, { status: 502 });
    const data = await r.json();
    const places = (Array.isArray(data) ? data : [])
      .map((e: any) => ({
        id: e.osm_id,
        name: e.display_name?.split(',')[0] || e.name || '',
        lat: parseFloat(e.lat),
        lng: parseFloat(e.lon),
        tags: { ...e.address, ...e.extratags, type: e.type, category: e.class }
      }))
      .filter((p: any) => p.lat && p.lng && p.name);
    return NextResponse.json({ places }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: any) {
    return NextResponse.json({ places: [], error: e?.message || 'failed' }, { status: 500 });
  }
}
