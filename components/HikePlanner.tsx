'use client';
import { useState } from 'react';
import { Compass, Footprints, Loader2 } from 'lucide-react';
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

export default function HikePlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [distance, setDistance] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard' | 'epic'>('easy');
  const [scenery, setScenery] = useState<'nature' | 'forest' | 'desert' | 'mountain' | 'water' | 'urban'>('nature');
  const [radius, setRadius] = useState<number>(50);
  const [chatKey, setChatKey] = useState(0);
  const [presetMessages, setPresetMessages] = useState<ChatMessage[] | undefined>();
  const [searching, setSearching] = useState(false);

  async function findRoute() {
    if (!coords) return;
    setSearching(true);
    const userText = lang === 'he'
      ? `מצא לי 3 מסלולי הליכה מסומנים, ${distance} ק״מ, ${ { easy: 'קל', med: 'בינוני', hard: 'קשה', epic: 'אפי' }[difficulty]}, נוף ${ { nature: 'טבע', forest: 'יער', desert: 'מדבר', mountain: 'הרים', water: 'מים', urban: 'עירוני' }[scenery]}, ${radius >= 9999 ? 'בכל הארץ' : `עד ${radius} ק״מ ממני`}.`
      : `Find me 3 marked hiking trails, ${distance}km, ${difficulty}, ${scenery} scenery, ${radius >= 9999 ? 'anywhere in country' : `within ${radius} km of me`}.`;
    try {
      const res = await fetch('/api/find-trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'hike',
          coords,
          filters: { location: locName, distance, difficulty, scenery, radiusKm: radius, coords },
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

  const sysPrompt = `You are an Israeli hiking buddy chatting with the user. The user is in ${locName} (${coords?.lat}, ${coords?.lng}).

The trails ABOVE in the conversation were found via verified data: real driving distances computed using OpenStreetMap Routing (OSRM). Trust those numbers — they are accurate.

For follow-up: discuss the trails naturally, suggest gear, water, weather, what to expect. Keep it casual like a friend. Reply in ${lang === 'he' ? 'natural Hebrew (עברית)' : 'natural English'}. Don't repeat the trail list — the user can see it.`;

  const initialMsg = lang === 'he'
    ? `יו 🥾 כוונן את הפילטרים (כולל כמה רחוק אתה מוכן לנסוע) ולחץ "מצא לי מסלול". אני מחפש שבילים מסומנים רשמית בלבד ומחשב נסיעה אמיתית ב-OSM — לא הערכה.`
    : `Hey 🥾 Tune filters (including drive distance) and click "Find route". I only search OFFICIALLY MARKED trails and compute REAL drive times via OSM Routing — not estimates.`;

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

          <button onClick={findRoute} disabled={!coords || searching} className="btn-primary mt-4 w-full disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Footprints className="h-4 w-4" />}
            {searching ? (lang === 'he' ? 'מחשב מרחקי נסיעה אמיתיים…' : 'Computing real driving distances…') : t('hike.findRoute')}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">🛰️ {lang === 'he' ? 'מרחקי נסיעה אמיתיים מ-OSM · רק שבילים מסומנים' : 'Real OSM drive times · marked trails only'}</p>
        </div>
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        presetMessages={presetMessages}
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
