'use client';
import { useState } from 'react';
import { Compass, Bike, Loader2 } from 'lucide-react';
import ChatBot, { type ChatMessage } from './ChatBot';
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
  const [presetMessages, setPresetMessages] = useState<ChatMessage[] | undefined>();
  const [searching, setSearching] = useState(false);

  async function findRoute() {
    if (!coords) return;
    setSearching(true);
    const userText = lang === 'he'
      ? `מצא לי 3 מסלולי ${ { road: 'כביש', gravel: 'גראבל', mtb: 'MTB', single: 'סינגלטרק', family: 'שביל אופניים משפחתי' }[type]} מאומתים, ${distance} ק״מ, ${ { easy: 'קל', med: 'בינוני', hard: 'קשה', epic: 'אפי' }[difficulty]}, ${radius >= 9999 ? 'בכל הארץ' : `עד ${radius} ק״מ ממני`}.`
      : `Find me 3 verified ${type} routes, ${distance}km, ${difficulty} difficulty, ${radius >= 9999 ? 'anywhere in country' : `within ${radius} km of me`}.`;
    try {
      const res = await fetch('/api/find-trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'bike',
          coords,
          filters: { location: locName, distance, difficulty, type, radiusKm: radius, coords },
          lang
        })
      });
      const data = await res.json();
      const reply = data.reply || (data.error ? `⚠️ ${data.error}` : (lang === 'he' ? 'לא נמצאו מסלולים' : 'No trails found'));
      setPresetMessages([
        { role: 'user', content: userText },
        { role: 'assistant', content: reply }
      ]);
      setChatKey(k => k + 1);
    } catch (e: any) {
      setPresetMessages([
        { role: 'user', content: userText },
        { role: 'assistant', content: `⚠️ ${e?.message || 'error'}` }
      ]);
      setChatKey(k => k + 1);
    } finally {
      setSearching(false);
    }
  }

  const sysPrompt = `You are an Israeli mountain biker friend chatting with the user. The user is in ${locName} (${coords?.lat}, ${coords?.lng}).

The trails ABOVE in the conversation were found via verified data: real driving distances were computed using OpenStreetMap Routing (OSRM). Trust those numbers — they are accurate.

For follow-up questions: discuss the trails naturally, suggest variations, talk about gear, conditions, what to pack. Keep it casual like a friend. Reply in ${lang === 'he' ? 'natural Hebrew (עברית)' : 'natural English'}. Don't repeat the trail list — the user can see it.`;

  const initialMsg = lang === 'he'
    ? `מה הולך 🚵 כוונן את הפילטרים — כולל מרחק נסיעה — ולחץ "מצא לי מסלול". אני אחפש מועמדים, אחשב נסיעה אמיתית בזמן אמת ב-OSM ואתן לך 3 הכי קרובים שמתאימים.`
    : `Hey 🚵 Tune filters — including how far you'll drive — and click "Find me a route". I'll search candidates, compute REAL driving times via OSM Routing, and return 3 verified picks within your radius.`;

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

          <button onClick={findRoute} disabled={!coords || searching} className="btn-primary mt-4 w-full disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />}
            {searching ? (lang === 'he' ? 'מחשב מרחקי נסיעה אמיתיים…' : 'Computing real driving distances…') : t('bike.findRoute')}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">🛰️ {lang === 'he' ? 'מרחקי נסיעה אמיתיים מ-OpenStreetMap' : 'Real driving distances from OpenStreetMap'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        presetMessages={presetMessages}
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
