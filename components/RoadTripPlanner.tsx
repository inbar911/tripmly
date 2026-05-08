'use client';
import { useState } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Compass, Truck, Save, MapPin } from 'lucide-react';
import ChatBot from './ChatBot';

const JEEP_SIZES = [
  { id: 'compact', label: 'Compact (Wrangler 2-door)', seats: 4, fuel: 12 },
  { id: 'midsize', label: 'Midsize (Wrangler 4-door)', seats: 5, fuel: 11 },
  { id: 'fullsize', label: 'Full-size (Grand Cherokee / Defender)', seats: 5, fuel: 10 },
  { id: 'pickup', label: 'Pickup (Gladiator / Hilux)', seats: 5, fuel: 9 }
];

export default function RoadTripPlanner() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState('');
  const [jeep, setJeep] = useState('midsize');
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(2);
  const [terrain, setTerrain] = useState<'mixed' | 'paved' | 'offroad' | 'desert' | 'mountain'>('mixed');
  const [saving, setSaving] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const jeepData = JEEP_SIZES.find(j => j.id === jeep)!;
  const tooMany = people > jeepData.seats;

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 32.0853, lng: 34.7818 })
    );
  }

  async function save() {
    if (!coords || !destination) { alert('Set your start location and destination first'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/save-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roadtrip',
          title: `Road trip → ${destination}`,
          payload: { start: coords, destination, jeep, people, days, terrain }
        })
      });
      const j = await res.json();
      alert(j.error || 'Saved!');
    } finally { setSaving(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          <button onClick={getLocation} className="btn-ghost !py-2 text-sm">
            <Compass className="h-4 w-4" /> {coords ? 'Refresh location' : 'Use my location as start'}
          </button>
          {coords && <p className="mt-2 text-xs text-slate-500">📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Destination">
              <input className="input" placeholder="Eilat, Mitzpe Ramon, Petra…" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </Field>
            <Field label="Days">
              <input type="number" min={1} max={30} className="input" value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </Field>
            <Field label="Jeep size">
              <select className="input" value={jeep} onChange={(e) => setJeep(e.target.value)}>
                {JEEP_SIZES.map(j => <option key={j.id} value={j.id}>{j.label} · {j.seats} seats</option>)}
              </select>
            </Field>
            <Field label="People">
              <input type="number" min={1} max={9} className="input" value={people} onChange={(e) => setPeople(Number(e.target.value))} />
              {tooMany && <span className="mt-1 block text-xs text-red-600">⚠️ Exceeds {jeepData.seats}-seat capacity</span>}
            </Field>
            <Field label="Terrain">
              <select className="input" value={terrain} onChange={(e) => setTerrain(e.target.value as any)}>
                <option value="mixed">Mixed</option>
                <option value="paved">Paved roads only</option>
                <option value="offroad">Off-road / 4x4</option>
                <option value="desert">Desert</option>
                <option value="mountain">Mountain</option>
              </select>
            </Field>
          </div>

          <button onClick={save} disabled={saving} className="btn-primary mt-4 w-full">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save road trip'}
          </button>
        </div>

        {coords && apiKey && (
          <APIProvider apiKey={apiKey}>
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-100" style={{ height: 320 }}>
              <Map defaultCenter={coords} defaultZoom={8} mapId="tripmly-roadtrip" gestureHandling="greedy">
                <Marker position={coords} />
              </Map>
            </div>
          </APIProvider>
        )}
      </div>

      <ChatBot
        systemPrompt={`You are Trip.ly's road-trip planner. The user is planning a JEEP trip. Build a day-by-day itinerary including: route segments with km, fuel stops (the jeep does ~${jeepData.fuel} km/L), suggested overnight camps or hotels, terrain warnings, what to pack, and rough budget. Be concrete with place names. Reply in clean markdown with day headings.`}
        initialAssistantMessage={`Ready to plan! ${coords ? `Starting from ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}` : 'Set your start point'} → ${destination || 'pick a destination'}, ${jeepData.label.split(' (')[0]} jeep, ${people} people, ${days} days, ${terrain} terrain. Tell me about your group's vibe (adventurous, family, photography, etc.) and any must-sees.`}
        context={{ start: coords, destination, jeep: jeepData, people, days, terrain }}
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
