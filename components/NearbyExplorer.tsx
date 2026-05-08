'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, MapPin, Loader2 } from 'lucide-react';
import ChatBot from './ChatBot';
import type { LeafletPlace } from './LeafletMap';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

const CATEGORIES = [
  { key: 'restaurant', overpass: 'amenity=restaurant', label: '🍽️ Eat' },
  { key: 'attraction', overpass: 'tourism=attraction', label: '🏛️ Attractions' },
  { key: 'park', overpass: 'leisure=park', label: '🌳 Parks' },
  { key: 'cafe', overpass: 'amenity=cafe', label: '☕ Cafés' },
  { key: 'bar', overpass: 'amenity=bar', label: '🍷 Nightlife' },
  { key: 'lodging', overpass: 'tourism=hotel', label: '🏨 Stay' }
];

export default function NearbyExplorer() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('restaurant');
  const [places, setPlaces] = useState<LeafletPlace[]>([]);
  const [loading, setLoading] = useState(false);

  function getLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const cat = CATEGORIES.find(c => c.key === category)!;
    const query = `[out:json][timeout:15];(node[${cat.overpass}](around:3000,${coords.lat},${coords.lng});way[${cat.overpass}](around:3000,${coords.lat},${coords.lng}););out center 30;`;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    })
      .then(r => r.json())
      .then(data => {
        const list: LeafletPlace[] = (data.elements || [])
          .filter((e: any) => e.tags?.name)
          .map((e: any) => ({
            id: e.id,
            name: e.tags.name,
            lat: e.lat ?? e.center?.lat,
            lng: e.lon ?? e.center?.lon,
            tags: e.tags
          }))
          .filter((p: LeafletPlace) => p.lat && p.lng)
          .slice(0, 25);
        setPlaces(list);
      })
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [coords, category]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <div className="card">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={getLocation} className="btn-ghost !py-2 text-sm">
              <Compass className="h-4 w-4" /> Use my location
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
            {coords && <span className="text-xs text-slate-500">📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === c.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-100" style={{ height: 380 }}>
          {coords && <LeafletMap center={coords} places={places} />}
        </div>

        <div className="card">
          <h3 className="font-bold">{places.length} places nearby</h3>
          {loading && <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading from OpenStreetMap…</div>}
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {places.map(p => (
              <a key={p.id} href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer"
                 className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  {p.tags?.cuisine && <div className="truncate text-xs text-slate-500">{p.tags.cuisine}</div>}
                  {p.tags?.['addr:street'] && <div className="truncate text-xs text-slate-500">{p.tags['addr:street']}</div>}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <ChatBot
        systemPrompt={`You are Trip.ly's local guide. The user is browsing the "${CATEGORIES.find(c => c.key === category)?.label}" category around their location. Suggest things to do nearby, compose a half-day or full-day plan, and recommend the best timing. Reply concisely.`}
        initialAssistantMessage={coords ? `I see you're near ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}. What's the vibe — chill, adventurous, foodie, cultural?` : 'Share your location to get personalized suggestions.'}
        context={{ coords, category, sample: places.slice(0, 5).map(p => p.name) }}
      />
    </div>
  );
}
