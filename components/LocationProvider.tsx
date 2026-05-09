'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Coords = { lat: number; lng: number };
export type LocationData = { coords: Coords | null; city: string; country: string; loading: boolean; refresh: () => void; error: string | null };

const Ctx = createContext<LocationData>({ coords: null, city: '', country: '', loading: false, refresh: () => {}, error: null });

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const askBrowser = useCallback((authed: boolean) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        if (authed) {
          try {
            const r = await fetch('/api/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: c.lat, lng: c.lng, accuracy: pos.coords.accuracy })
            });
            const d = await r.json();
            if (d.city) setCity(d.city);
            if (d.country) setCountry(d.country);
          } catch {}
        } else {
          try {
            const r = await fetch(`/api/geocode?lat=${c.lat}&lng=${c.lng}`);
            const d = await r.json();
            if (d.city) setCity(d.city);
            if (d.country) setCountry(d.country);
          } catch {}
        }
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const authed = !!user;
    setSignedIn(authed);

    if (authed) {
      try {
        const r = await fetch('/api/location');
        const d = await r.json();
        if (d.location) {
          setCoords({ lat: d.location.lat, lng: d.location.lng });
          setCity(d.location.city || '');
          setCountry(d.location.country || '');
          setLoading(false);
          return;
        }
      } catch {}
    }
    askBrowser(authed);
  }, [askBrowser]);

  useEffect(() => { init(); }, [init]);

  const refresh = useCallback(() => {
    setError(null);
    askBrowser(signedIn);
  }, [askBrowser, signedIn]);

  return (
    <Ctx.Provider value={{ coords, city, country, loading, refresh, error }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLocation = () => useContext(Ctx);
