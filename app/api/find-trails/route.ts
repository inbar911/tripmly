import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FAST_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
const SEARCH_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];

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
  const radiusKm = filters.radiusKm || 9999;
  const radiusInstruction = radiusKm >= 9999
    ? 'Spread candidates across the country.'
    : `Concentrate candidates likely WITHIN ${Math.round(radiusKm * 1.4)} km driving of the user. Closest first.`;

  const userPrompt = mode === 'bike'
    ? `User location: ${userLoc} (${filters.coords.lat}, ${filters.coords.lng}).
Find 15 candidate bike trails:
- type: ${filters.type}
- target ride distance: ${filters.distance}km
- difficulty: ${filters.difficulty}
${radiusInstruction}
Real Israeli trail names: KKL forests (אשתאול, בן שמן, סטף, חרובית, עפרים, יתיר, מסורק, צרעה, גורן), Sugarcane (סוכר), Ramat Hanadiv, Park Ariel Sharon, Park Yarkon, Carmel singletracks. Spread by region — closest first.`
    : `User location: ${userLoc} (${filters.coords.lat}, ${filters.coords.lng}).
Find 15 OFFICIALLY MARKED hiking trails:
- scenery: ${filters.scenery}
- target length: ${filters.distance}km
- difficulty: ${filters.difficulty}
${radiusInstruction}
Real marked trails (red/blue/green/black blaze by SPNI, KKL, INPA, Israel National Trail). Examples: Yarkon Park, Apollonia, Hadera Stream, Tel Afek, Ein Hemed, Sataf, Ein Prat, Carmel NP, Mt Tabor, Banias, Ein Gedi, Avshalom, Adulam. Spread by region — closest first.`;

  const schema = {
    type: 'object',
    properties: {
      trails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            search_query: { type: 'string', description: 'Geocoding query for OpenStreetMap, e.g. "Eshtaol Forest, Israel"' },
            area: { type: 'string' },
            length_km: { type: 'number' },
            elevation_m: { type: 'number' },
            difficulty: { type: 'string' },
            marking_color: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name', 'search_query', 'area', 'length_km', 'difficulty', 'description']
        }
      }
    },
    required: ['trails']
  };

  for (const model of FAST_MODELS) {
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
        signal: AbortSignal.timeout(20000)
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

async function crossVerifyWithSearch(
  trails: Verified[],
  userLoc: string,
  userCoords: { lat: number; lng: number },
  mode: 'bike' | 'hike',
  filters: any,
  lang: string
): Promise<string | null> {
  if (!trails.length) return null;
  const apiKey = process.env.GEMINI_API_KEY!;

  const trailList = trails.map((t, i) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${t.lat},${t.lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${t.lat},${t.lng}&navigate=yes`;
    return `${i + 1}. **${t.name}** — ${t.area}${t.marking_color ? ` (${t.marking_color} blaze)` : ''}
   - OSM road distance: ${t.drive_km.toFixed(0)} km / ${Math.round(t.drive_min)} min
   - Trail length: ${t.length_km} km${t.elevation_m ? `, +${t.elevation_m}m elev` : ''}, difficulty ${t.difficulty}
   - Coords: ${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}
   - Maps URL: ${mapsUrl}
   - Waze URL: ${wazeUrl}
   - Description: ${t.description}`;
  }).join('\n\n');

  const prompt = lang === 'he'
    ? `המשתמש ב-${userLoc}. מצאתי 3 מסלולי ${mode === 'bike' ? 'אופניים' : 'הליכה'} עם נתוני נסיעה מ-OpenStreetMap. עכשיו אני צריך שתאמת את הזמנים נגד מקורות אחרים (Google Maps, Waze, AllTrails, Komoot, MTB.co.il).

מסלולים:
${trailList}

החזר תשובה ב-markdown במבנה הבא לכל מסלול:
- כותרת H3 עם מספור ושם המסלול
- שורה אחת על האזור וצבע סימון
- **🚗 זמן נסיעה אמיתי: X ק״מ · Y דקות** (מבוסס על המקורות הכי טובים שמצאת בחיפוש — OSM, גוגל מפס, ויז וכו')
- אורך מסלול, ערמת גובה, קושי
- 2-3 משפטי תיאור
- כפתור **[📍 ניווט במפות](MAPS_URL)** · **[🚗 פתח בוויז](WAZE_URL)**
- אם המקורות חולקים על OSM, ציין את שני הזמנים עם המקור

דבר בעברית טבעית כמו חבר, לא בוט. התחל ב"מצאתי לך 3 מסלולים שמתאימים..."`
    : `User is in ${userLoc}. I found 3 ${mode} trails with OpenStreetMap routing data. Now I need you to verify the times against other sources (Google Maps, Waze, AllTrails, Komoot, MTB.co.il).

Trails:
${trailList}

Return markdown for each trail:
- H3 heading with numbered trail name
- One line about area + blaze color
- **🚗 Real drive time: X km · Y min** (based on the best sources you found via search — OSM, Google Maps, Waze, etc.)
- Trail length, elevation, difficulty
- 2-3 sentence description
- **[📍 Drive (Maps)](MAPS_URL)** · **[🚗 Open in Waze](WAZE_URL)**
- If sources disagree with OSM, show both times with source

Talk casually like a friend, not a bot. Start with "Found 3 routes for you..."`;

  for (const model of SEARCH_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2200, thinkingConfig: { thinkingBudget: 0 } }
        }),
        signal: AbortSignal.timeout(40000)
      });
      const data = await r.json();
      if (r.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') continue;
      if (!r.ok) continue;
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
      if (text) return text;
    } catch {}
  }
  return null;
}

function buildBaseMarkdown(verified: Verified[], filters: any, lang: string): string {
  const intro = lang === 'he'
    ? `מצאתי לך **${verified.length}** מסלולים. נסיעה מחושבת ב-OpenStreetMap Routing.\n\n`
    : `Found **${verified.length}** routes. Drive time computed via OpenStreetMap Routing.\n\n`;
  const parts = verified.map((t, i) => {
    const km = t.drive_km.toFixed(0);
    const min = Math.round(t.drive_min);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${filters.coords.lat},${filters.coords.lng}&destination=${t.lat},${t.lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${t.lat},${t.lng}&navigate=yes`;
    if (lang === 'he') {
      return `### ${i + 1}. ${t.name}
${t.area}${t.marking_color ? ` · סימון ${t.marking_color}` : ''}

**🚗 נסיעה: ${km} ק״מ · ${min} דקות**
- אורך מסלול: ${t.length_km} ק״מ${t.elevation_m ? ` · ערמת גובה ${t.elevation_m} מ׳` : ''}
- קושי: ${t.difficulty}

${t.description}

[📍 ניווט במפות](${mapsUrl}) · [🚗 פתח בוויז](${wazeUrl})`;
    }
    return `### ${i + 1}. ${t.name}
${t.area}${t.marking_color ? ` · ${t.marking_color} blaze` : ''}

**🚗 Drive: ${km} km · ${min} min**
- Trail length: ${t.length_km} km${t.elevation_m ? ` · elevation ${t.elevation_m} m` : ''}
- Difficulty: ${t.difficulty}

${t.description}

[📍 Drive (Maps)](${mapsUrl}) · [🚗 Open in Waze](${wazeUrl})`;
  });
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
      let geo = await geocode(c.search_query);
      if (!geo) geo = await geocode(`${c.area}, Israel`);
      if (!geo) geo = await geocode(`${c.name}, ${c.area}, Israel`);
      if (!geo) return;
      const route = await drivingRoute(coords, geo);
      if (!route) return;
      enriched.push({ ...c, lat: geo.lat, lng: geo.lng, drive_km: route.km, drive_min: route.min });
    }));

    const radius = filters.radiusKm || 9999;
    const inRange = enriched.filter(e => e.drive_km <= radius).sort((a, b) => a.drive_km - b.drive_km);
    const top = inRange.slice(0, 3);

    if (!top.length) {
      return NextResponse.json({
        reply: lang === 'he'
          ? `לא מצאתי מסלולים בטווח של ${radius >= 9999 ? 'כל הארץ' : `${radius} ק״מ`} ממך. נסה להגדיל את הטווח.`
          : `No trails within ${radius >= 9999 ? 'the country' : `${radius} km`} of you. Try widening the radius.`,
        count: 0,
        totalCandidates: candidates.length
      });
    }

    const verifiedMarkdown = await crossVerifyWithSearch(top, filters.location || '', coords, mode, filters, lang);
    const finalReply = verifiedMarkdown || buildBaseMarkdown(top, { ...filters, coords }, lang);

    return NextResponse.json({ reply: finalReply, count: top.length, totalCandidates: candidates.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
