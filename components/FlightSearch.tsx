'use client';
import { useMemo, useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { AIRLINES, META_SEARCH, type SearchParams } from '@/lib/airlines';
import { ExternalLink, Plane, Save } from 'lucide-react';
import ChatBot from './ChatBot';

export default function FlightSearch() {
  const [origin, setOrigin] = useState('TLV');
  const [destination, setDestination] = useState('JFK');
  const [depart, setDepart] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [ret, setRet] = useState(new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10));
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState<'economy' | 'business' | 'first'>('economy');
  const [saving, setSaving] = useState(false);

  const params: SearchParams = { origin, destination, depart, return: ret, passengers: pax, cabin };
  const meta = useMemo(() => META_SEARCH(params), [origin, destination, depart, ret, pax, cabin]);

  async function saveTrip() {
    setSaving(true);
    try {
      const res = await fetch('/api/save-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flight',
          title: `${origin} → ${destination}`,
          payload: params
        })
      });
      const j = await res.json();
      if (j.error) alert(j.error);
      else alert('Saved!');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="From">
              <select className="input" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.iata}>{c.emoji} {c.name} ({c.iata})</option>)}
              </select>
            </Field>
            <Field label="To">
              <select className="input" value={destination} onChange={(e) => setDestination(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.iata}>{c.emoji} {c.name} ({c.iata})</option>)}
              </select>
            </Field>
            <Field label="Depart"><input type="date" className="input" value={depart} onChange={(e) => setDepart(e.target.value)} /></Field>
            <Field label="Return"><input type="date" className="input" value={ret} onChange={(e) => setRet(e.target.value)} /></Field>
            <Field label="Passengers">
              <input type="number" min={1} max={9} className="input" value={pax} onChange={(e) => setPax(Number(e.target.value))} />
            </Field>
            <Field label="Cabin">
              <select className="input" value={cabin} onChange={(e) => setCabin(e.target.value as any)}>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </Field>
          </div>
          <button onClick={saveTrip} disabled={saving} className="btn-ghost mt-4 w-full">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save trip'}
          </button>
        </div>

        <div className="card">
          <h3 className="font-bold">Book on airline sites</h3>
          <p className="text-xs text-slate-500">Real deep-links — opens the airline's official booking page with your search.</p>
          <div className="mt-3 grid gap-2">
            {AIRLINES.map(a => (
              <a key={a.code} href={a.buildSearchUrl(params)} target="_blank" rel="noreferrer"
                 className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium transition hover:bg-slate-100">
                <span className="flex items-center gap-2"><span className="text-xl">{a.logo}</span> {a.name}</span>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
          <h4 className="mt-4 font-bold">Compare prices</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <a href={meta.google} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Google Flights</a>
            <a href={meta.skyscanner} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Skyscanner</a>
            <a href={meta.kayak} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-xs">Kayak</a>
          </div>
        </div>
      </div>

      <ChatBot
        systemPrompt={`You are Trip.ly's flight planner. Help the user choose destinations among 150 countries, suggest itineraries, best seasons, layover tips, and budget estimates. Reply concisely with bullet points. When the user picks a route, tell them to use the booking buttons on the left.`}
        initialAssistantMessage={`Hi! I see you're searching ${origin} → ${destination} on ${depart}. Want suggestions for activities, layovers, or alternative dates? Or pick a different route?`}
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
