'use client';
import { useState } from 'react';
import { Compass, Bike } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';
import { useLocation } from './LocationProvider';

const RADIUS_OPTIONS: { value: number; key: string }[] = [
  { value: 5, key: 'bike.r.5' },
  { value: 15, key: 'bike.r.15' },
  { value: 30, key: 'bike.r.30' },
  { value: 50, key: 'bike.r.50' },
  { value: 100, key: 'bike.r.100' },
  { value: 9999, key: 'bike.r.any' }
];

export default function BikePlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [distance, setDistance] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('med');
  const [type, setType] = useState<'road' | 'gravel' | 'mtb' | 'single' | 'family'>('single');
  const [radius, setRadius] = useState<number>(30);
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

  const radiusLabel = lang === 'he'
    ? (radius >= 9999 ? 'בכל מקום בארץ' : `עד ${radius} ק״מ ממיקומי`)
    : (radius >= 9999 ? 'anywhere in country' : `within ${radius} km of me`);

  function findRoute() {
    const typeLabel = lang === 'he'
      ? { road: 'כביש', gravel: 'גראבל', mtb: 'MTB שטח', single: 'סינגלטרק', family: 'שביל אופניים משפחתי' }[type]
      : { road: 'road', gravel: 'gravel', mtb: 'MTB off-road', single: 'singletrack', family: 'family bike path' }[type];
    const diffLabel = lang === 'he'
      ? { easy: 'קל', med: 'בינוני', hard: 'קשה', epic: 'אפי' }[difficulty]
      : { easy: 'easy', med: 'medium', hard: 'hard', epic: 'epic' }[difficulty];
    const prompt = lang === 'he'
      ? `חפש לי 3 מסלולי אופניים אמיתיים ${radiusLabel}. מיקומי: ${locName || 'לא ידוע'} (${coords?.lat}, ${coords?.lng}). סוג: ${typeLabel}, מרחק רכיבה: ~${distance} ק״מ, רמת קושי: ${diffLabel}.

חיפוש מעמיק באתרי קקל (kkl.org.il), Israelhiking, MTB.co.il, Singletrack.co.il, Komoot, AllTrails. לכל מסלול:
- שם רשמי
- מיקום מדויק
- **מרחק נסיעה ברכב מהמיקום שלי** (חייב להיות בתוך הטווח שביקשתי)
- אורך מסלול בק״מ (אמיתי, מהמקור)
- ערמת גובה במטרים (אמיתית)
- רמת קושי לפי המקור
- סוג מסלול (לולאה/הלוך-חזור)
- תיאור קצר ותנאי שטח
- [📍 מפות](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes)

דבר בעברית טבעית, חברותית. אל תמציא — רק מה שמצאת.`
      : `Find me 3 real bike routes ${radiusLabel}. My location: ${locName || 'unknown'} (${coords?.lat}, ${coords?.lng}). Type: ${typeLabel}, ride distance ~${distance}km, difficulty ${diffLabel}.

Deep search KKL, Israelhiking, MTB.co.il, Singletrack.co.il, Komoot, AllTrails. For each:
- Official name
- Exact location
- **Driving distance from my location** (must fit my requested radius)
- Real distance, elevation, source-rated difficulty
- Loop / out-and-back
- Short description and terrain
- [📍 Maps](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes)

Talk casually like a friend. Don't invent — only verified data.`;
    setAutoMsg(prompt);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are an enthusiastic Israeli mountain biker friend, not a corporate bot. The user is in ${locName || 'unknown location'} (${coords?.lat}, ${coords?.lng}). Search radius preference: ${radiusLabel}.

USE GOOGLE SEARCH to find real, verified bike trails. Sources: kkl.org.il, israelhiking.osm.org.il, MTB.co.il, Singletrack.co.il, Komoot, AllTrails, Strava heatmaps.

CRITICAL — RADIUS FILTERING:
- ALWAYS calculate the rough driving distance from user's coordinates to each suggested trailhead.
- ONLY suggest trails within ${radius >= 9999 ? 'the entire country' : `${radius} km driving distance`}.
- If a famous trail is outside the radius, mention it briefly but DON'T recommend it.
- Show the driving distance clearly for each suggestion ("~25 ק״מ ממך" / "~25 km from you").

PERSONALITY:
- Talk like a real biking buddy: warm, casual, uses biker slang ("טראגן", "ירידה מטריפה", "סינגל מטיסה").
- In Hebrew: speak in flowing natural Hebrew, not stiff formal text. Use contractions, exclamation marks where they fit naturally.
- Pick up on what the user said earlier in the conversation. Remember their preferences. Reference past messages when relevant.
- Don't repeat the same intro every reply.
- Ask follow-up questions when it makes sense ("רוצה שאמצא משהו יותר טכני?").

RULES:
1. NEVER invent trails or numbers. Cross-reference 2+ sources.
2. Real numbers: distance (km), elevation gain (m), source-rated difficulty.
3. For each trail include [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes).
4. Reply in ${lang === 'he' ? 'Hebrew (עברית) — natural conversational Hebrew' : 'English — natural conversational English'}.`;

  const initialMsg = lang === 'he'
    ? `מה הולך! 🚵 אני יודע שאתה ב**${locName || 'מיקומך'}**. כוונן את הפילטרים — כולל כמה רחוק אתה מוכן לנסוע — ואני אביא לך 3 מסלולים אמיתיים ומאומתים. אפשר גם פשוט לכתוב לי במילים מה אתה מחפש.`
    : `What's up! 🚵 You're in **${locName || 'your area'}**. Tune the filters — including how far you're willing to drive — and I'll bring 3 verified routes. You can also just tell me in your own words what you're after.`;

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
            <Field label={t('bike.radius')}>
              <select className="input" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.key as any)}</option>)}
              </select>
            </Field>
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
          <p className="mt-2 text-center text-[10px] text-slate-500">🌐 {lang === 'he' ? 'חיפוש מעמיק באתרי קקל, Israelhiking, MTB' : 'Deep search across KKL, Israelhiking, MTB'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
        useSearch={true}
        context={{ location: locName, coords, distance, difficulty, type, radiusKm: radius }}
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
