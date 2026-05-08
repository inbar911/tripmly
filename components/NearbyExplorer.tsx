'use client';
import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Compass, MapPin, Loader2 } from 'lucide-react';
import ChatBot from './ChatBot';

type Place = { name: string; vicinity?: string; rating?: number; place_id: string; geometry: { location: { lat: number; lng: number } }; types?: string[] };

const CATEGORIES = [
  { key: 'restaurant', label: '🍽️ Eat' },
  { key: 'tourist_attraction', label: '🏛️ Attractions' },
  { key: 'park', label: '🌳 Parks' },
  { key: 'cafe', label: '☕ Cafés' },
  { key: 'bar', label: '🍷 Nightlife' },
  { key: 'lodging', label: '🏨 Stay' }
];

export default function NearbyExplorer() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('restaurant');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
    if (!coords || !apiKey) return;
    setLoading(true);
    const svc = document.createElement('script');
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      const map = new (window as any).google.maps.Map(document.createElement('div'));
      const places = new (window as any).google.maps.places.PlacesService(map);
      places.nearbySearch({ location: coords, radius: 3000, type: category }, (results: any[], status: string) => {
        setLoading(false);
        if (status === 'OK') setPlaces(results.slice(0, 20));
      });
    } else {
      setLoading(false);
    }
  }, [coords, category, apiKey]);

  if (!apiKey) {
    return <div className="card text-sm text-slate-600">Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local to enable Maps.</div>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
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
            {coords && (
              <Map defaultCenter={coords} defaultZoom={14} mapId="tripmly-map" gestureHandling="greedy">
                <Marker position={coords} />
                {places.map(p => (
                  <Marker key={p.place_id} position={p.geometry.location} />
                ))}
              </Map>
            )}
          </div>

          <div className="card">
            <h3 className="font-bold">{places.length} places nearby</h3>
            {loading && <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {places.map(p => (
                <a key={p.place_id} href={`https://www.google.com/maps/place/?q=place_id:${p.place_id}`} target="_blank" rel="noreferrer"
                   className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-slate-500">{p.vicinity}</div>
                    {p.rating && <div className="mt-0.5 text-xs">⭐ {p.rating}</div>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <ChatBot
          systemPrompt={`You are Trip.ly's local guide. The user just shared their location and is browsing the "${CATEGORIES.find(c => c.key === category)?.label}" category. Suggest things to do nearby, compose a half-day or full-day plan, and recommend the best timing. Reply concisely.`}
          initialAssistantMessage={coords ? `I see you're near ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}. What kind of vibe are you in the mood for — chill, adventurous, foodie, cultural?` : 'Share your location to get personalized suggestions.'}
          context={{ coords, category, sample: places.slice(0, 5).map(p => p.name) }}
        />
      </div>
    </APIProvider>
  );
}
