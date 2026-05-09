'use client';
import { useState } from 'react';
import { Compass, Bike } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';
import { useLocation } from './LocationProvider';

export default function BikePlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [distance, setDistance] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('med');
  const [type, setType] = useState<'road' | 'gravel' | 'mtb' | 'single' | 'family'>('single');
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

  function findRoute() {
    const typeLabel = lang === 'he'
      ? { road: 'כביש', gravel: 'גראבל', mtb: 'MTB שטח', single: 'סינגלטרק', family: 'שביל אופניים משפחתי' }[type]
      : { road: 'road', gravel: 'gravel', mtb: 'MTB off-road', single: 'singletrack', family: 'family bike path' }[type];
    const diffLabel = lang === 'he'
      ? { easy: 'קל', med: 'בינוני', hard: 'קשה', epic: 'אפי' }[difficulty]
      : { easy: 'easy', med: 'medium', hard: 'hard', epic: 'epic' }[difficulty];
    const prompt = lang === 'he'
      ? `חפש לי 3 מסלולי אופניים אמיתיים בקרבת ${locName || 'מיקומי'} (קואורדינטות ${coords?.lat}, ${coords?.lng}). סוג: ${typeLabel}, מרחק: ~${distance} ק״מ, רמת קושי: ${diffLabel}.

חיפוש מעמיק באתרי קקל (kkl.org.il), Israelhiking (israelhiking.osm.org.il), MTB.co.il, Singletrack.co.il, AllTrails, וכל מקור אחר רלוונטי. לכל מסלול:
- שם רשמי
- מיקום מדויק (יער/פארק/אזור)
- אורך אמיתי בק״מ (לא הערכה)
- ערמת גובה אמיתית במטרים
- רמת קושי מדויקת (לפי המקור)
- סוג מסלול (לולאה/הלוך-חזור/חציה)
- תיאור קצר ותנאי שטח
- לינק [📍 מפות](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) לנקודת ההתחלה

תמצית את התשובה בטבלאות מסודרות במרקדאון. אל תמציא נתונים — רק מה שמצאת.`
      : `Find me 3 real bike routes near ${locName || 'my location'} (${coords?.lat}, ${coords?.lng}). Type: ${typeLabel}, distance ~${distance}km, difficulty ${diffLabel}.

Search KKL (kkl.org.il), Israelhiking, MTB.co.il, Singletrack.co.il, AllTrails. For each route:
- Official name
- Exact location (forest/park/area)
- Real distance in km (not estimate)
- Real elevation gain in meters
- Accurate difficulty (per source)
- Loop / out-and-back / point-to-point
- Short description and terrain
- [📍 Maps](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) for trailhead

Use markdown tables. Don't invent — only verified data.`;
    setAutoMsg(prompt);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are Trip.ly's bike route expert with web search access. The user is in ${locName || 'unknown location'} (${coords?.lat}, ${coords?.lng}).

USE GOOGLE SEARCH to find real, verified bike trails — search KKL (kkl.org.il), Israelhiking.osm.org.il, MTB.co.il, Singletrack.co.il, AllTrails, Komoot, Strava. Cross-reference 2+ sources before stating distance/elevation.

RULES:
1. NEVER invent trails or numbers. If a fact isn't verifiable, say "approximately" or omit.
2. Always include real numbers: distance (km), elevation gain (m), difficulty rating from the source.
3. Format each route with a markdown table or clear bullets.
4. Include [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) deep-links for the trailhead.
5. Reply in ${lang === 'he' ? 'Hebrew (עברית)' : 'English'}.
6. Match user's distance/difficulty/type strictly.`;

  const initialMsg = lang === 'he'
    ? `מסלולים מאומתים בסביבת **${locName || 'מיקומך'}**. כווננו פרמטרים ולחצו "מצא לי מסלול" — אעשה חיפוש מעמיק באתרי קקל ו-Israelhiking ואחזיר נתונים מדויקים בלבד.`
    : `Verified routes near **${locName || 'your location'}**. Tune parameters and click "Find route" — I'll search KKL, Israelhiking and return verified data only.`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">📍 {loading ? '…' : (locName || (coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : '—'))}</p>
            <button onClick={refresh} className="btn-ghost !py-1.5 text-xs">
              <Compass className="h-3 w-3" /> {t('road.refresh')}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <Field label={t('bike.distance')}>
              <input type="number" min={5} max={300} className="input" value={distance} onChange={(e) => setDistance(Math.max(5, Math.min(300, Number(e.target.value) || 30)))} />
            </Field>
            <Field label={t('bike.difficulty')}>
              <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">{t('bike.diff.easy')}</option>
                <option value="med">{t('bike.diff.med')}</option>
                <option value="hard">{t('bike.diff.hard')}</option>
                <option value="epic">{t('bike.diff.epic')}</option>
              </select>
            </Field>
            <Field label={t('bike.type')}>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="single">{t('bike.t.single')}</option>
                <option value="mtb">{t('bike.t.mtb')}</option>
                <option value="gravel">{t('bike.t.gravel')}</option>
                <option value="road">{t('bike.t.road')}</option>
                <option value="family">{t('bike.t.family')}</option>
              </select>
            </Field>
          </div>

          <button onClick={findRoute} disabled={!coords} className="btn-primary mt-4 w-full disabled:opacity-50">
            <Bike className="h-4 w-4" /> {t('bike.findRoute')}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">🌐 {lang === 'he' ? 'חיפוש מעמיק באתרי קקל, Israelhiking, MTB' : 'Deep search across KKL, Israelhiking, MTB sites'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
        useSearch={true}
        context={{ location: locName, coords, distance, difficulty, type }}
        height={620}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
