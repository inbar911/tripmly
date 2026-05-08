'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, MapPin, Loader2 } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';
import type { LeafletPlace } from './LeafletMap';
import type { TKey } from '@/lib/i18n';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">…</div> });

const CATEGORIES: { key: string; labelKey: TKey }[] = [
  { key: 'restaurant', labelKey: 'nearby.cat.eat' },
  { key: 'attraction', labelKey: 'nearby.cat.attractions' },
  { key: 'park', labelKey: 'nearby.cat.parks' },
  { key: 'cafe', labelKey: 'nearby.cat.cafes' },
  { key: 'bar', labelKey: 'nearby.cat.bars' },
  { key: 'lodging', labelKey: 'nearby.cat.lodging' }
];

export default function NearbyExplorer() {
  const { t, lang } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('restaurant');
  const [places, setPlaces] = useState<LeafletPlace[]>([]);
  const [loading, setLoading] = useState(false);

  function getLocation() {
    setError(null);
    if (!navigator.geolocation) { setError(lang === 'he' ? 'אין תמיכה במיקום' : 'Geolocation not supported'); return; }
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
    const ctrl = new AbortController();
    fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&cat=${category}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => setPlaces(data.places || []))
      .catch((e) => { if (e.name !== 'AbortError') setPlaces([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [coords, category]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <div className="card">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={getLocation} className="btn-ghost !py-2 text-sm">
              <Compass className="h-4 w-4" /> {t('nearby.useLocation')}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
            {coords && <span className="text-xs text-slate-500">📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === c.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {t(c.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-100" style={{ height: 380 }}>
          {coords ? <LeafletMap center={coords} places={places} /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">{t('common.loading')}</div>}
        </div>

        <div className="card">
          <h3 className="font-bold">{places.length} {t('nearby.placesNearby')}</h3>
          {loading && <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> {t('nearby.loadingOSM')}</div>}
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
        systemPrompt={`You are Trip.ly's local guide. The user is browsing the "${category}" category around their current location. Suggest things to do nearby, compose a half-day or full-day plan, and recommend timing. Reply concisely.`}
        initialAssistantMessage={coords
          ? (lang === 'he' ? `אני רואה שאתם ב-${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}. איזו אווירה בא לכם — רגוע, הרפתקני, אוכל, תרבותי?` : `I see you're near ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}. What's the vibe — chill, adventurous, foodie, cultural?`)
          : (lang === 'he' ? 'שתפו את המיקום כדי לקבל המלצות.' : 'Share your location to get suggestions.')}
        context={{ coords, category, sample: places.slice(0, 5).map(p => p.name) }}
      />
    </div>
  );
}
