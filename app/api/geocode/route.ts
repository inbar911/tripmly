import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const lang = searchParams.get('lang') || 'en';
  if (!lat || !lng) return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });

  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}&zoom=14`, {
      headers: { 'User-Agent': 'Tripmly/1.0 (https://tripmly.vercel.app)' },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return NextResponse.json({ error: 'geocode failed' }, { status: 502 });
    const data = await r.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.suburb || a.county || '';
    const country = a.country || '';
    const display = data.display_name || '';
    return NextResponse.json(
      { city, country, display, address: a },
      { headers: { 'Cache-Control': 's-maxage=86400' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
