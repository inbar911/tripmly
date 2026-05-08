import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILTERS: Record<string, string[]> = {
  restaurant: ['amenity=restaurant', 'amenity=fast_food'],
  attraction: ['tourism=attraction', 'tourism=museum', 'tourism=viewpoint', 'tourism=gallery', 'historic=monument', 'historic=memorial', 'historic=castle', 'historic=ruins'],
  park: ['leisure=park', 'leisure=garden', 'leisure=nature_reserve', 'natural=beach'],
  cafe: ['amenity=cafe', 'amenity=ice_cream'],
  bar: ['amenity=bar', 'amenity=pub', 'amenity=nightclub'],
  lodging: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house', 'tourism=apartment'],
  shop: ['shop'],
  fuel: ['amenity=fuel', 'amenity=charging_station']
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const cat = searchParams.get('cat') || 'restaurant';
  const radius = parseInt(searchParams.get('r') || '3000');
  if (!lat || !lng) return NextResponse.json({ places: [], error: 'lat/lng required' }, { status: 400 });

  const tags = FILTERS[cat] || FILTERS.restaurant;
  const parts = tags.flatMap(tag => {
    const sel = tag.includes('=') ? `[${tag}]` : `[${tag}]`;
    return [
      `node${sel}(around:${radius},${lat},${lng});`,
      `way${sel}(around:${radius},${lat},${lng});`
    ];
  }).join('');
  const query = `[out:json][timeout:25];(${parts});out center 60;`;

  const MIRRORS = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter'
  ];

  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Tripmly/1.0 (https://tripmly.vercel.app)'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(20000)
      });
      if (!r.ok) continue;
      const data = await r.json();
      const places = (data.elements || [])
        .filter((e: any) => e.tags?.name)
        .map((e: any) => ({
          id: e.id,
          name: e.tags.name,
          lat: e.lat ?? e.center?.lat,
          lng: e.lon ?? e.center?.lon,
          tags: e.tags
        }))
        .filter((p: any) => p.lat && p.lng)
        .slice(0, 30);
      return NextResponse.json({ places }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
    } catch {}
  }
  return NextResponse.json({ places: [], error: 'All mirrors failed' }, { status: 502 });
}
