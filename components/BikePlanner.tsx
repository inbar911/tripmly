'use client';
import { useEffect, useState } from 'react';
import { Compass, Bike } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';

export default function BikePlanner() {
  const { t, lang } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locName, setLocName] = useState<string>('');
  const [distance, setDistance] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('med');
  const [type, setType] = useState<'road' | 'gravel' | 'mtb' | 'single' | 'family'>('single');
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

  function getLocation() {
    if (!navigator.geolocation) { setCoords({ lat: 32.0853, lng: 34.7818 }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 32.0853, lng: 34.7818 })
    );
  }

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (!coords) return;
    fetch(`/api/geocode?lat=${coords.lat}&lng=${coords.lng}&lang=${lang}`)
      .then(r => r.json())
      .then(d => setLocName([d.city, d.country].filter(Boolean).join(', ')))
      .catch(() => {});
  }, [coords, lang]);

  function findRoute() {
    const typeLabel = lang === 'he'
      ? { road: 'כביש', gravel: 'גראבל', mtb: 'MTB שטח', single: 'סינגלטרק', family: 'שביל אופניים משפחתי' }[type]
      : { road: 'road', gravel: 'gravel', mtb: 'MTB off-road', single: 'singletrack', family: 'family bike path' }[type];
    const diffLabel = lang === 'he'
      ? { easy: 'קל', med: 'בינוני', hard: 'קשה', epic: 'אפי' }[difficulty]
      : { easy: 'easy', med: 'medium', hard: 'hard', epic: 'epic' }[difficulty];
    const prompt = lang === 'he'
      ? `מצא לי 3 מסלולי אופניים אמיתיים בסביבת ${locName || 'מיקומי'} בארץ. סוג: ${typeLabel}, מרחק רצוי: ~${distance} ק״מ, רמת קושי: ${diffLabel}. לכל מסלול תן: שם אמיתי, אזור, אורך, ערמת גובה משוערת, תיאור קצר, ולינק לגוגל מפס + ויז של נקודת ההתחלה.`
      : `Find me 3 real bike routes near ${locName || 'my location'}. Type: ${typeLabel}, target distance ~${distance}km, difficulty ${diffLabel}. For each give: real name, area, length, approx elevation gain, short description, and Google Maps + Waze links to the trailhead.`;
    setAutoMsg(prompt);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are Trip.ly's bike route expert. The user is in ${locName || 'unknown location'} (lat=${coords?.lat}, lng=${coords?.lng}).

KNOWLEDGE: You have deep knowledge of Israeli bike trails — singletracks, MTB parks, and bike paths. Examples (use ONLY when relevant to user's actual area): Sugarcane (סוכר), Eshtaol (אשתאול), Park HaMassorek (פארק המסורק), Givat Koach (גבעת כ״ח), Tzora (צרעה), Ben Shemen (בן שמן), Park Ofer (פארק עופר), Ramat Hanadiv (רמת הנדיב), Goren Park (גורן), Carmel singletracks (כרמל), Mount Tabor (תבור), Bezet (בצת), Yatir Forest (יתיר), Park Britannia (בריטניה), Ein Hashofet (עין השופט), Iron Park (פארק העיר ברזל), HaShita Forest. Outside Israel use trails relevant to that country.

RULES:
1. Always give 3 REAL named routes — never invent.
2. For EACH route output:
   - **Route name** (real, in user's language)
   - Area / nearest town
   - Distance (km), elevation gain (m), difficulty
   - Short description (2 sentences)
   - [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=ROUTE_NAME+AREA) [🚗 Waze](https://waze.com/ul?q=TRAILHEAD_NAME&navigate=yes)
3. Use markdown headings and bullets. Reply in ${lang === 'he' ? 'Hebrew (עברית)' : 'English'}.
4. Match user's distance/difficulty/type strictly.`;

  const initialMsg = lang === 'he'
    ? `אני בחיפוש מסלולים בסביבת **${locName || 'מיקומך'}**. כווננו את הפרמטרים ולחצו "מצא לי מסלול" — אביא 3 מסלולים אמיתיים עם לינקים.`
    : `Ready to find routes near **${locName || 'your location'}**. Tune the parameters and click "Find me a route" — I'll bring 3 real routes with links.`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <button onClick={getLocation} className="btn-ghost !py-2 text-sm">
            <Compass className="h-4 w-4" /> {coords ? t('road.refresh') : t('road.useStart')}
          </button>
          {coords && <p className="mt-2 text-xs text-slate-500">📍 {locName || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}</p>}

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

          <button onClick={findRoute} className="btn-primary mt-4 w-full">
            <Bike className="h-4 w-4" /> {t('bike.findRoute')}
          </button>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
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
