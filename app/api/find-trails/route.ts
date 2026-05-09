import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SEARCH_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  try {
    const { mode, coords, filters, lang } = await req.json();
    if (!coords?.lat || !coords?.lng) return NextResponse.json({ error: 'no coords' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const radius = filters.radiusKm || 9999;
    const radiusText = radius >= 9999
      ? (lang === 'he' ? 'בכל הארץ' : 'anywhere in country')
      : (lang === 'he' ? `עד ${radius} ק״מ נסיעה ממני` : `within ${radius} km drive of me`);

    const criteria = mode === 'bike'
      ? (lang === 'he'
          ? `סוג רכיבה: ${filters.type}, מרחק רכיבה: ${filters.distance} ק״מ, רמת קושי: ${filters.difficulty}`
          : `ride type: ${filters.type}, ride distance: ${filters.distance}km, difficulty: ${filters.difficulty}`)
      : (lang === 'he'
          ? `נוף: ${filters.scenery}, אורך: ${filters.distance} ק״מ, רמת קושי: ${filters.difficulty} (רק שבילים מסומנים רשמית)`
          : `scenery: ${filters.scenery}, length: ${filters.distance}km, difficulty: ${filters.difficulty} (officially marked trails only)`);

    const prompt = lang === 'he'
      ? `אני נמצא ב-${filters.location || 'מיקום שלי'} (lat=${coords.lat}, lng=${coords.lng}).

מצא לי **3 מסלולי ${mode === 'bike' ? 'אופניים' : 'הליכה'} אמיתיים** במרחק ${radiusText}, לפי הקריטריונים: ${criteria}.

חיפוש מעמיק בגוגל:
1. לכל מסלול שאתה מציע, חפש בגוגל "Google Maps directions from ${coords.lat},${coords.lng} to {שם המסלול}" וקרא את **המרחק והזמן בנהיגה לפי Google Maps**.
2. הצלב מ-Waze, AllTrails, Komoot, MTB.co.il, KKL.
3. ודא שהמרחק בנהיגה (מ-Google Maps) בתוך הטווח שביקשתי. **אם זה לא בטווח — אל תכלול אותו!**
4. אל תמציא — רק מסלולים אמיתיים שמצאת בחיפוש.

פורמט תשובה (markdown):
התחל ב"מצאתי לך 3 מסלולים מעולים..." — דבר טבעי כמו חבר.

לכל מסלול:
### מספר. **שם המסלול**
*אזור · סימון צבע (אם רלוונטי)*

**🚗 נסיעה: X ק״מ · Y דקות** (לפי Google Maps)
- אורך מסלול: Z ק״מ, ערמת גובה, רמת קושי
- 2-3 משפטי תיאור

[📍 ניווט במפות](https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=URLENCODED_NAME_AND_AREA) · [🚗 פתח בוויז](https://waze.com/ul?q=URLENCODED_NAME_AND_AREA&navigate=yes)

חשוב: בלינקים, החלף URLENCODED_NAME_AND_AREA בשם המסלול והאזור עם + בין מילים. למשל: יער+אשתאול+ישראל.`
      : `I'm at ${filters.location || 'my location'} (lat=${coords.lat}, lng=${coords.lng}).

Find me **3 real ${mode} routes** within ${radiusText}, matching: ${criteria}.

Deep Google search:
1. For each candidate, search "Google Maps directions from ${coords.lat},${coords.lng} to {trail name}" and read the **actual driving distance and time from Google Maps results**.
2. Cross-check Waze, AllTrails, Komoot, MTB.co.il, KKL websites.
3. Verify drive distance (per Google Maps) is within my requested radius. **If not in range, don't include it!**
4. Don't invent — only real trails you found.

Response format (markdown):
Start with "Found 3 great routes for you..." — talk casually like a friend.

For each:
### N. **Trail Name**
*Area · color blaze (if applicable)*

**🚗 Drive: X km · Y min** (per Google Maps)
- Trail length: Z km, elevation, difficulty
- 2-3 sentence description

[📍 Drive (Maps)](https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=URLENCODED_NAME_AND_AREA) · [🚗 Open in Waze](https://waze.com/ul?q=URLENCODED_NAME_AND_AREA&navigate=yes)

Important: replace URLENCODED_NAME_AND_AREA with the trail name and area, using + between words. Example: Eshtaol+Forest+Israel.`;

    let lastErr = 'no model responded';
    for (const model of SEARCH_MODELS) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              thinkingConfig: { thinkingBudget: 0 }
            }
          }),
          signal: AbortSignal.timeout(50000)
        });
        const data = await r.json();
        if (r.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
          lastErr = 'quota';
          continue;
        }
        if (!r.ok) {
          lastErr = data?.error?.message || `HTTP ${r.status}`;
          continue;
        }
        const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
        if (reply) {
          const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources = chunks.map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null).filter(Boolean).slice(0, 8);
          return NextResponse.json({ reply, sources, model });
        }
      } catch (e: any) {
        lastErr = e?.message || 'fetch failed';
      }
    }
    return NextResponse.json({ reply: '', error: lastErr }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
