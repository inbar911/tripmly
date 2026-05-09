'use client';
import { useMemo, useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { AIRLINES, META_SEARCH, type SearchParams } from '@/lib/airlines';
import { ExternalLink, Save } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';

export default function FlightSearch() {
  const { t, lang } = useI18n();
  const today = new Date();
  const dPlus = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + n).toISOString().slice(0, 10);
  const [origin, setOrigin] = useState('TLV');
  const [destination, setDestination] = useState('JFK');
  const [depart, setDepart] = useState(dPlus(14));
  const [ret, setRet] = useState(dPlus(21));
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState<'economy' | 'business' | 'first'>('economy');
  const [saving, setSaving] = useState(false);

  const params: SearchParams = { origin, destination, depart, return: ret, passengers: pax, cabin };
  const meta = useMemo(() => META_SEARCH(params), [origin, destination, depart, ret, pax, cabin]);
  const datesValid = depart && ret && depart <= ret;
  const sameAirport = origin === destination;

  async function saveTrip() {
    if (sameAirport) { alert(lang === 'he' ? 'בחרו יעדים שונים' : 'Pick different airports'); return; }
    if (!datesValid) { alert(lang === 'he' ? 'בדקו את התאריכים' : 'Check dates'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/save-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'flight', title: `${origin} → ${destination}`, payload: params })
      });
      const j = await res.json();
      if (res.status === 401) alert(lang === 'he' ? 'התחברו תחילה' : 'Sign in first');
      else if (j.error) alert(j.error);
      else alert(t('common.saved'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t('flights.from')}>
              <select className="input" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.iata}>{c.emoji} {c.name} ({c.iata})</option>)}
              </select>
            </Field>
            <Field label={t('flights.to')}>
              <select className="input" value={destination} onChange={(e) => setDestination(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.iata}>{c.emoji} {c.name} ({c.iata})</option>)}
              </select>
            </Field>
            <Field label={t('flights.depart')}><input type="date" min={dPlus(0)} className="input" value={depart} onChange={(e) => setDepart(e.target.value)} /></Field>
            <Field label={t('flights.return')}><input type="date" min={depart} className="input" value={ret} onChange={(e) => setRet(e.target.value)} /></Field>
            <Field label={t('flights.passengers')}>
              <input type="number" min={1} max={9} className="input" value={pax} onChange={(e) => setPax(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} />
            </Field>
            <Field label={t('flights.cabin')}>
              <select className="input" value={cabin} onChange={(e) => setCabin(e.target.value as any)}>
                <option value="economy">{t('flights.cabin.economy')}</option>
                <option value="business">{t('flights.cabin.business')}</option>
                <option value="first">{t('flights.cabin.first')}</option>
              </select>
            </Field>
          </div>
          {sameAirport && <p className="mt-2 text-xs text-red-600">{lang === 'he' ? 'בחרו שני יעדים שונים' : 'Pick two different airports'}</p>}
          <button onClick={saveTrip} disabled={saving || sameAirport || !datesValid} className="btn-ghost mt-4 w-full disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold">{t('flights.book')}</h3>
          <p className="text-xs text-slate-500">{t('flights.bookNote')}</p>
          <div className="mt-3 grid gap-2">
            {AIRLINES.map(a => (
              <a key={a.code} href={a.buildSearchUrl(params)} target="_blank" rel="noreferrer"
                 className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium transition hover:bg-slate-100">
                <span className="flex items-center gap-2"><span className="text-xl">{a.logo}</span> {a.name}</span>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
          <h4 className="mt-4 font-bold">{t('flights.compare')}</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <a href={meta.google} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Google Flights</a>
            <a href={meta.skyscanner} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Skyscanner</a>
            <a href={meta.kayak} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Kayak</a>
          </div>
        </div>
      </div>

      <ChatBot
        key={`${origin}-${destination}`}
        systemPrompt={`You are Trip.ly's flight planner. The user has CONFIGURED their search: from ${origin} to ${destination}, depart ${depart}, return ${ret}, ${pax} passenger(s), ${cabin}.

CRITICAL: Whenever the user asks vague questions like "what to do", "where to eat", "what to see", "recommend something", "any tips" — assume they mean AT THE DESTINATION (${destination}). Don't ask "where do you mean" — they mean the destination they're flying to. Recommend specific real places, foods, neighborhoods at ${destination}. When suggesting bookings, point them to the airline buttons in the panel.`}
        initialAssistantMessage={lang === 'he'
          ? `מתואם ל-**${origin} → ${destination}**, ${depart}${ret ? ` עד ${ret}` : ''}, ${pax} נוסע. שאל אותי כל דבר על ${destination} — מה לעשות, איפה לאכול, אילו שכונות, תקציב — ואני יודע שמדובר ביעד שלך.`
          : `Configured for **${origin} → ${destination}**, ${depart}${ret ? ` to ${ret}` : ''}, ${pax} pax. Ask me anything about ${destination} — what to do, where to eat, neighborhoods, budget — I know you mean your destination.`}
        context={params}
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
