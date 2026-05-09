'use client';
import { useState } from 'react';
import { Compass, Footprints } from 'lucide-react';
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

export default function HikePlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [distance, setDistance] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('easy');
  const [scenery, setScenery] = useState<'nature' | 'forest' | 'desert' | 'mountain' | 'water' | 'urban'>('nature');
  const [radius, setRadius] = useState<number>(50);
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

  const radiusLabel = lang === 'he'
    ? (radius >= 9999 ? 'בכל מקום בארץ' : `עד ${radius} ק״מ ממיקומי`)
    : (radius >= 9999 ? 'anywhere in country' : `within ${radius} km of me`);

  function findRoute() {
    const sceneryLabel = lang === 'he'
      ? { nature: 'טבע כללי', forest: 'יער', desert: 'מדבר', mountain: 'הרים', water: 'נחלים/מים', urban: 'עירוני / טיילת' }[scenery]
      : { nature: 'nature', forest: 'forest', desert: 'desert', mountain: 'mountain', water: 'streams/water', urban: 'urban / promenade' }[scenery];
    const diffLabel = lang === 'he'
      ? { easy: 'קל / משפחתי', med: 'בינוני', hard: 'קשה', epic: 'אפי / כל היום' }[difficulty]
      : { easy: 'easy / family', med: 'medium', hard: 'hard', epic: 'epic / full-day' }[difficulty];
    const prompt = lang === 'he'
      ? `חפש לי 3 מסלולי הליכה מסומנים רשמית ${radiusLabel}. מיקומי: ${locName || 'לא ידוע'} (${coords?.lat}, ${coords?.lng}). נוף: ${sceneryLabel}, אורך: ~${distance} ק״מ, רמת קושי: ${diffLabel}.

חשוב: רק מסלולים **מסומנים רשמית** (סימון שבילים אדום/כחול/ירוק/שחור של החברה להגנת הטבע, מסלולי קקל, מסלולי גן לאומי, או שביל ישראל). לא מסלולים אקראיים.

חפש בקקל (kkl.org.il), Israelhiking, parks.org.il (רט"ג), שביל ישראל, Tiuli, AllTrails. לכל מסלול:
- שם רשמי + צבע סימון
- אזור (גן לאומי / יער / שמורה)
- **מרחק נסיעה ממיקומי** (חייב להיות בתוך הטווח)
- אורך אמיתי בק״מ + ערמת גובה אמיתית
- זמן הליכה משוער + רמת קושי
- מים בדרך, צל, גישה ברכב
- [📍 מפות](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes)

דבר בעברית טבעית כמו חבר. רק נתונים מאומתים.`
      : `Find me 3 OFFICIALLY MARKED hiking trails ${radiusLabel}. My location: ${locName || 'unknown'} (${coords?.lat}, ${coords?.lng}). Scenery: ${sceneryLabel}, length ~${distance}km, difficulty ${diffLabel}.

CRITICAL: Only **officially marked trails** (color-blazed by Israeli SPNI: red/blue/green/black, KKL marked routes, national park routes, or Israel National Trail). NOT random unmarked paths.

Search kkl.org.il, israelhiking, parks.org.il, Israel National Trail, Tiuli, AllTrails. For each:
- Official name + blaze color
- Area (national park / forest / reserve)
- **Driving distance from my location** (must fit radius)
- Real distance + real elevation gain
- Walking time + source-rated difficulty
- Water, shade, car access
- [📍 Maps](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes)

Talk casually like a friend. Verified data only.`;
    setAutoMsg(prompt);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are a knowledgeable Israeli hiking buddy with years of trail experience. The user is in ${locName || 'unknown location'} (${coords?.lat}, ${coords?.lng}). Search radius preference: ${radiusLabel}.

USE GOOGLE SEARCH for verified, OFFICIALLY MARKED hiking trails only.
- Israeli marked trails use color blazes: red (אדום), blue (כחול), green (ירוק), black (שחור) — issued by SPNI / החברה להגנת הטבע.
- Other valid sources: KKL marked routes, רשות הטבע והגנים (parks.org.il), שביל ישראל / Israel National Trail, Tiuli, Israelhiking.osm.org.il.
- NEVER recommend unmarked or "off-piste" routes.

CRITICAL — RADIUS FILTERING:
- Calculate driving distance from user's coords to each trailhead.
- ONLY suggest trails within ${radius >= 9999 ? 'the entire country' : `${radius} km driving distance`}.
- Show driving distance clearly ("~30 ק״מ ממך" / "~30 km from you").

PERSONALITY:
- Talk like a friend who hikes a lot — warm, casual, in flowing natural Hebrew or English.
- Use contractions, exclamations, gentle slang. Avoid stiff bullet-list-only replies in casual conversation.
- Remember and reference what the user said earlier in this conversation. Build on it.
- Skip robotic phrases like "Here are 3 routes:" — instead say something like "תקשיב, מצאתי לך משהו שווה" or "okay so I think you'll love this".
- Ask follow-ups when natural ("רוצה משהו עם נחל בדרך?" / "want something with a stream?").

RULES:
1. NEVER invent. Cross-reference 2+ sources.
2. Real distance (km), elevation gain (m), source-rated difficulty, marking color.
3. Note water sources, shade level, car/bus access.
4. For each trail: [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=NAME) [🚗 Waze](https://waze.com/ul?q=NAME&navigate=yes).
5. Reply in ${lang === 'he' ? 'natural conversational Hebrew' : 'natural conversational English'}.`;

  const initialMsg = lang === 'he'
    ? `יו, מה שלומך 🥾 אני מכיר את האזור של **${locName || 'מיקומך'}** טוב. כוונן את הפילטרים (כמה רחוק אתה מוכן לנסוע, איזה נוף, רמה) — או פשוט תכתוב לי מה בא לך לראות היום, ואני אמצא לך מסלולים מסומנים רשמית.`
    : `Hey there 🥾 I know the area around **${locName || 'your location'}**. Tune the filters (how far you'll drive, what scenery, what level) — or just tell me what you feel like seeing today, and I'll find officially marked trails.`;

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
          <p className="mt-2 text-center text-[10px] text-slate-500">🌐 {lang === 'he' ? 'רק שבילים מסומנים רשמית · קקל, רט"ג, שביל ישראל' : 'Only officially marked trails · KKL, INPA, INT'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
        useSearch={true}
        context={{ location: locName, coords, distance, difficulty, scenery, radiusKm: radius }}
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
