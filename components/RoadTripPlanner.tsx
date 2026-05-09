'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, Save } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';
import { useLocation } from './LocationProvider';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">…</div> });

const JEEP_SIZES = [
  { id: 'compact', he: 'קומפקטי (Wrangler 2 דלתות)', en: 'Compact (Wrangler 2-door)', seats: 4, fuel: 12 },
  { id: 'midsize', he: 'בינוני (Wrangler 4 דלתות)', en: 'Midsize (Wrangler 4-door)', seats: 5, fuel: 11 },
  { id: 'fullsize', he: 'גדול (Grand Cherokee / Defender)', en: 'Full-size (Grand Cherokee / Defender)', seats: 5, fuel: 10 },
  { id: 'pickup', he: 'טנדר (Gladiator / Hilux)', en: 'Pickup (Gladiator / Hilux)', seats: 5, fuel: 9 }
];

export default function RoadTripPlanner() {
  const { t, lang } = useI18n();
  const { coords, city, country, refresh, loading } = useLocation();
  const locName = [city, country].filter(Boolean).join(', ');
  const [destination, setDestination] = useState('');
  const [jeep, setJeep] = useState('midsize');
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(2);
  const [terrain, setTerrain] = useState<'mixed' | 'paved' | 'offroad' | 'desert' | 'mountain'>('mixed');
  const [saving, setSaving] = useState(false);

  const jeepData = JEEP_SIZES.find(j => j.id === jeep)!;
  const jeepLabel = lang === 'he' ? jeepData.he : jeepData.en;
  const tooMany = people > jeepData.seats;

  async function save() {
    if (!coords || !destination) { alert(lang === 'he' ? 'הגדירו יעד' : 'Set destination'); return; }
    if (tooMany) { alert(lang === 'he' ? 'מספר האנשים חורג מקיבולת הג׳יפ' : 'Too many people for this jeep'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/save-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roadtrip',
          title: `Road trip → ${destination}`,
          payload: { start: coords, startName: locName, destination, jeep, people, days, terrain }
        })
      });
      const j = await res.json();
      if (res.status === 401) alert(lang === 'he' ? 'התחברו תחילה' : 'Sign in first');
      else alert(j.error || t('common.saved'));
    } finally { setSaving(false); }
  }

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

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label={t('road.destination')}>
              <input className="input" placeholder={t('road.destPlaceholder')} value={destination} onChange={(e) => setDestination(e.target.value)} />
            </Field>
            <Field label={t('road.days')}>
              <input type="number" min={1} max={30} className="input" value={days} onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
            </Field>
            <Field label={t('road.jeep')}>
              <select className="input" value={jeep} onChange={(e) => setJeep(e.target.value)}>
                {JEEP_SIZES.map(j => <option key={j.id} value={j.id}>{lang === 'he' ? j.he : j.en} · {j.seats}</option>)}
              </select>
            </Field>
            <Field label={t('road.people')}>
              <input type="number" min={1} max={9} className="input" value={people} onChange={(e) => setPeople(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} />
              {tooMany && <span className="mt-1 block text-xs text-red-600">{t('road.exceedsSeats')}</span>}
            </Field>
            <Field label={t('road.terrain')}>
              <select className="input" value={terrain} onChange={(e) => setTerrain(e.target.value as any)}>
                <option value="mixed">{t('road.terrain.mixed')}</option>
                <option value="paved">{t('road.terrain.paved')}</option>
                <option value="offroad">{t('road.terrain.offroad')}</option>
                <option value="desert">{t('road.terrain.desert')}</option>
                <option value="mountain">{t('road.terrain.mountain')}</option>
              </select>
            </Field>
          </div>

          <button onClick={save} disabled={saving || tooMany || !coords || !destination} className="btn-primary mt-4 w-full disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? t('common.saving') : t('road.saveTrip')}
          </button>
        </div>

        {coords && (
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-100" style={{ height: 320 }}>
            <LeafletMap center={coords} zoom={8} height={320} />
          </div>
        )}
      </div>

      <ChatBot
        key={locName + destination + jeep + people + days + terrain}
        systemPrompt={`You are Trip.ly's road-trip planner. JEEP details: ${jeepLabel}, fuel ~${jeepData.fuel} km/L, ${jeepData.seats} seats. User starts in ${locName || 'unknown'} (${coords?.lat},${coords?.lng}), heading to ${destination || 'unspecified'}, ${people} people, ${days} days, terrain: ${terrain}. Build a concrete day-by-day plan: route segments with km, fuel stops, overnight camps/hotels, what to pack, budget. Use real place names. For each major stop include [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=PLACE+CITY) [🚗 Waze](https://waze.com/ul?q=PLACE&navigate=yes). Reply in markdown with day headings.`}
        initialAssistantMessage={lang === 'he'
          ? `מוכן! ${locName ? `מתחילים מ-**${locName}**` : 'הגדירו נקודת התחלה'} → ${destination || 'בחרו יעד'}, ${jeepLabel.split(' (')[0]}, ${people} אנשים, ${days} ימים. ספרו על האווירה (הרפתקני, משפחתי, צילום).`
          : `Ready! ${locName ? `Starting from **${locName}**` : 'Set start point'} → ${destination || 'pick a destination'}, ${jeepLabel.split(' (')[0]}, ${people} people, ${days} days, ${terrain}. Tell me your group's vibe.`}
        context={{ start: locName, coords, destination, jeep: jeepData, people, days, terrain }}
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
