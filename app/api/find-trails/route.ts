import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];

type TrailCandidate = {
  name: string;
  search_query: string;
  area: string;
  length_km: number;
  elevation_m: number;
  difficulty: string;
  marking_color?: string;
  description: string;
};

type Verified = TrailCandidate & {
  lat: number;
  lng: number;
  drive_km: number;
  drive_min: number;
};

async function getCandidates(mode: 'bike' | 'hike', userLoc: string, filters: any, lang: string): Promise<TrailCandidate[]> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const isHebrew = lang === 'he';

  const userPrompt = mode === 'bike'
    ? `User location: ${userLoc} (${filters.coords.lat}, ${filters.coords.lng}).
Find 10 candidate bike trails:
- type: ${filters.type}
- target ride distance: ${filters.distance}km
- difficulty: ${filters.difficulty}
Israeli trails: use real names from KKL, MTB.co.il, Singletrack.co.il, Komoot, Strava heatmaps. Return widely spread candidates across regions so we can filter by driving distance later.`
    : `User location: ${userLoc} (${filters.coords.lat}, ${filters.coords.lng}).
Find 10 OFFICIALLY MARKED hiking trails:
- scenery: ${filters.scenery}
- target length: ${filters.distance}km
- difficulty: ${filters.difficulty}
Israeli trails: real marked trails (red/blue/green/black blaze by SPNI, KKL, INPA, Israel National Trail). Return widely spread candidates across regions so we can filter by driving distance later.`;

  const schema = {
    type: 'object',
    properties: {
      trails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: isHebrew ? 'שם המסלול בעברית' : 'Trail name' },
            search_query: { type: 'string', description: 'Geocoding query for OpenStreetMap, e.g. "Eshtaol Forest, Israel" — must locate the trailhead area' },
            area: { type: 'string', description: isHebrew ? 'אזור (יער/פארק/הר)' : 'Area (forest/park/mountain)' },
            length_km: { type: 'number' },
            elevation_m: { type: 'number' },
            difficulty: { type: 'string' },
            marking_color: { type: 'string', description: isHebrew ? 'אדום/כחול/ירוק/שחור או ריק' : 'red/blue/green/black or empty' },
            description: { type: 'string', description: isHebrew ? 'תיאור קצר בעברית' : 'Short description' }
          },
          required: ['name', 'search_query', 'area', 'length_km', 'difficulty', 'description']
        }
      }
    },
    required: ['trails']
  };

  for (const model of MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.7,
            maxOutputTokens: 3000,
            thinkingConfig: { thinkingBudget: 0 }
          }
        }),
        signal: AbortSignal.timeout(25000)
      });
      const data = await r.json();
      if (r.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') continue;
      if (!r.ok) continue;
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.trails)) return parsed.trails;
      } catch {}
    } catch {}
  }
  return [];
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=il`, {
      headers: { 'User-Agent': 'Tripmly/1.0 (https://tripmly.vercel.app)' },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) {
      const r2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Tripmly/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (!r2.ok) return null;
      const arr2 = await r2.json();
      if (!Array.isArray(arr2) || !arr2.length) return null;
      return { lat: parseFloat(arr2[0].lat), lng: parseFloat(arr2[0].lon) };
    }
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  } catch { return null; }
}

async function drivingRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ km: number; min: number } | null> {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    const data = await r.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    return { km: route.distance / 1000, min: route.duration / 60 };
  } catch { return null; }
}

function buildMarkdown(verified: Verified[], mode: 'bike' | 'hike', filters: any, lang: string): string {
  if (!verified.length) {
    return lang === 'he'
      ? `לא מצאתי מסלולים בטווח של ${filters.radiusKm >= 9999 ? 'כל הארץ' : `${filters.radiusKm} ק״מ`} ממך שמתאימים. נסה להגדיל את טווח המרחק או לשנות את רמת הקושי.`
      : `Couldn't find verified trails within ${filters.radiusKm >= 9999 ? 'the country' : `${filters.radiusKm} km`} matching those filters. Try widening the radius or adjusting difficulty.`;
  }
  const parts = verified.map((t, i) => {
    const km = t.drive_km.toFixed(0);
    const min = Math.round(t.drive_min);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${filters.coords.lat},${filters.coords.lng}&destination=${t.lat},${t.lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${t.lat},${t.lng}&navigate=yes`;
    if (lang === 'he') {
      return `### ${i + 1}. ${t.name}
${t.area}${t.marking_color ? ` · סימון ${t.marking_color}` : ''}

**🚗 נסיעה אמיתית: ${km} ק״מ · ${min} דקות**
- אורך מסלול: ${t.length_km} ק״מ${t.elevation_m ? ` · ערמת גובה ${t.elevation_m} מ׳` : ''}
- קושי: ${t.difficulty}

${t.description}

[📍 ניווט במפות](${mapsUrl}) · [🚗 פתח בוויז](${wazeUrl})`;
    }
    return `### ${i + 1}. ${t.name}
${t.area}${t.marking_color ? ` · ${t.marking_color} blaze` : ''}

**🚗 Real drive: ${km} km · ${min} min**
- Trail length: ${t.length_km} km${t.elevation_m ? ` · elevation ${t.elevation_m} m` : ''}
- Difficulty: ${t.difficulty}

${t.description}

[📍 Drive (Maps)](${mapsUrl}) · [🚗 Open in Waze](${wazeUrl})`;
  });
  const intro = lang === 'he'
    ? `מצאתי לך **${verified.length}** מסלולים מאומתים. **חישבתי את זמן הנסיעה האמיתי לכל אחד** דרך OpenStreetMap Routing — לא הערכה.\n\n`
    : `Found **${verified.length}** verified routes. **Real driving time computed via OpenStreetMap Routing** — not an estimate.\n\n`;
  return intro + parts.join('\n\n---\n\n');
}

export async function POST(req: Request) {
  try {
    const { mode, coords, filters, lang } = await req.json();
    if (!coords?.lat || !coords?.lng) return NextResponse.json({ error: 'no coords' }, { status: 400 });

    const candidates = await getCandidates(mode, filters.location || '', { ...filters, coords }, lang);
    if (!candidates.length) return NextResponse.json({ reply: lang === 'he' ? 'לא הצלחתי למצוא מועמדים. נסה שוב.' : 'No candidates found. Try again.' });

    const enriched: Verified[] = [];
    await Promise.all(candidates.map(async (c) => {
      const geo = await geocode(c.search_query);
      if (!geo) return;
      const route = await drivingRoute(coords, geo);
      if (!route) return;
      enriched.push({ ...c, lat: geo.lat, lng: geo.lng, drive_km: route.km, drive_min: route.min });
    }));

    const radius = filters.radiusKm || 9999;
    const inRange = enriched.filter(e => e.drive_km <= radius).sort((a, b) => a.drive_km - b.drive_km);
    const top = inRange.slice(0, 3);

    const markdown = buildMarkdown(top, mode, { ...filters, coords }, lang);
    return NextResponse.json({ reply: markdown, count: top.length, totalCandidates: candidates.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
