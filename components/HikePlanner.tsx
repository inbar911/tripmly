'use client';
import { useState } from 'react';
import { Compass, Footprints } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';
import { useLocation } from './LocationProvider';

export default function HikePlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [distance, setDistance] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('easy');
  const [scenery, setScenery] = useState<'nature' | 'forest' | 'desert' | 'mountain' | 'water' | 'urban'>('nature');
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

  function findRoute() {
    const sceneryLabel = lang === 'he'
      ? { nature: 'טבע כללי', forest: 'יער', desert: 'מדבר', mountain: 'הרים', water: 'נחלים/מים', urban: 'עירוני / טיילת' }[scenery]
      : { nature: 'nature', forest: 'forest', desert: 'desert', mountain: 'mountain', water: 'streams/water', urban: 'urban / promenade' }[scenery];
    const diffLabel = lang === 'he'
      ? { easy: 'קל / משפחתי', med: 'בינוני', hard: 'קשה', epic: 'אפי / כל היום' }[difficulty]
      : { easy: 'easy / family', med: 'medium', hard: 'hard', epic: 'epic / full-day' }[difficulty];
    const prompt = lang === 'he'
      ? `חפש לי 3 מסלולי טיול ברגל אמיתיים בקרבת ${locName || 'מיקומי'} (קואורדינטות ${coords?.lat}, ${coords?.lng}). נוף: ${sceneryLabel}, אורך: ~${distance} ק״מ, רמת קושי: ${diffLabel}.

חיפוש מעמיק באתרי קקל (kkl.org.il), Israelhiking (israelhiking.osm.org.il), שביל ישראל, רשות הטבע והגנים (parks.org.il), Tiuli, AllTrails. לכל מסלול:
- שם רשמי
- מיקום (גן לאומי / יער / שמורה)
- אורך אמיתי בק״מ
- ערמת גובה אמיתית במטרים
- זמן הליכה משוער
- רמת קושי לפי המקור
- סוג מסלול (לולאה/הלוך-חזור/חציה)
- מקורות מים, צל, נגישות לרכב
- תיאור קצר
- [📍 מפות](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) לנקודת התחלה

תמצית בטבלאות מרקדאון. רק נתונים מאומתים.`
      : `Find me 3 real hiking routes near ${locName || 'my location'} (${coords?.lat}, ${coords?.lng}). Scenery: ${sceneryLabel}, distance ~${distance}km, difficulty ${diffLabel}.

Search KKL, Israelhiking, Israel National Trail, parks.org.il, Tiuli, AllTrails. For each:
- Official name
- Location (national park / forest / reserve)
- Real distance (km)
- Real elevation gain (m)
- Estimated walking time
- Source-rated difficulty
- Loop / out-and-back / point-to-point
- Water sources, shade, car access
- Short description
- [📍 Maps](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) for trailhead

Markdown tables. Verified data only.`;
    setAutoMsg(prompt);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are Trip.ly's hiking expert with web search. User is in ${locName || 'unknown location'} (${coords?.lat}, ${coords?.lng}).

USE GOOGLE SEARCH to find real, verified hiking trails. Sources: kkl.org.il, israelhiking.osm.org.il, parks.org.il, Israel National Trail, Tiuli, AllTrails, Komoot.

RULES:
1. NEVER invent trails or numbers. Cross-reference 2+ sources before stating distance/elevation/time.
2. Include real numbers and source-rated difficulty.
3. Note water availability, shade, car/bus access.
4. Markdown table or clear bullets per route.
5. Always add [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes) deep-links for trailhead.
6. Reply in ${lang === 'he' ? 'Hebrew (עברית)' : 'English'}.`;

  const initialMsg = lang === 'he'
    ? `מסלולי הליכה מאומתים בסביבת **${locName || 'מיקומך'}**. כווננו פרמטרים ולחצו "מצא לי מסלול" — אחפש בקקל, רשות הטבע והגנים, Israelhiking ואחזיר נתונים מדויקים.`
    : `Verified hiking trails near **${locName || 'your location'}**. Tune parameters and click "Find route" — I'll search KKL, parks.org.il, Israelhiking and return accurate data.`;

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
            <Field label={t('hike.distance')}>
              <input type="number" min={1} max={50} className="input" value={distance} onChange={(e) => setDistance(Math.max(1, Math.min(50, Number(e.target.value) || 8)))} />
            </Field>
            <Field label={t('hike.difficulty')}>
              <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">{t('hike.diff.easy')}</option>
                <option value="med">{t('hike.diff.med')}</option>
                <option value="hard">{t('hike.diff.hard')}</option>
                <option value="epic">{t('hike.diff.epic')}</option>
              </select>
            </Field>
            <Field label={t('hike.scenery')}>
              <select className="input" value={scenery} onChange={(e) => setScenery(e.target.value as any)}>
                <option value="nature">{t('hike.s.nature')}</option>
                <option value="forest">{t('hike.s.forest')}</option>
                <option value="mountain">{t('hike.s.mountain')}</option>
                <option value="desert">{t('hike.s.desert')}</option>
                <option value="water">{t('hike.s.water')}</option>
                <option value="urban">{t('hike.s.urban')}</option>
              </select>
            </Field>
          </div>

          <button onClick={findRoute} disabled={!coords} className="btn-primary mt-4 w-full disabled:opacity-50">
            <Footprints className="h-4 w-4" /> {t('hike.findRoute')}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">🌐 {lang === 'he' ? 'חיפוש מעמיק בקקל, רשות הטבע והגנים, Israelhiking' : 'Deep search across KKL, INPA, Israelhiking'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
        useSearch={true}
        context={{ location: locName, coords, distance, difficulty, scenery }}
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
