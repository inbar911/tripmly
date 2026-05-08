'use client';
import { useEffect, useState } from 'react';
import { Compass, Search } from 'lucide-react';
import ChatBot from './ChatBot';
import { useI18n } from './I18nProvider';

const QUICK_PROMPTS_HE = [
  { label: '🍽️ אוכל קרוב', prompt: 'מצא לי 5 מסעדות מומלצות בסביבתי. לכל אחת תן שם אמיתי, סוג מטבח, ולינק לגוגל מפס ולוויז.' },
  { label: '☕ בית קפה', prompt: 'מצא לי 5 בתי קפה מומלצים בסביבתי עם לינקים לגוגל מפס ולוויז.' },
  { label: '🛍️ חנויות', prompt: 'מצא לי חנויות מעניינות בסביבתי עם לינקים לגוגל מפס ולוויז.' },
  { label: '🏛️ אטרקציות', prompt: 'מצא לי 5 אטרקציות תיירותיות מומלצות בסביבתי. עם לינקים לגוגל מפס ולוויז.' },
  { label: '🌳 פארקים', prompt: 'מצא לי פארקים וגנים יפים בסביבתי. עם לינקים לגוגל מפס ולוויז.' },
  { label: '🍷 חיי לילה', prompt: 'איפה כדאי לבלות הערב? בארים ופאבים בסביבתי, עם לינקים לגוגל מפס ולוויז.' }
];
const QUICK_PROMPTS_EN = [
  { label: '🍽️ Food', prompt: 'Find me 5 great restaurants near me. For each give the real name, cuisine, and Google Maps + Waze links.' },
  { label: '☕ Cafés', prompt: 'Find me 5 great cafés near me with Google Maps + Waze links.' },
  { label: '🛍️ Shops', prompt: 'Find me interesting shops near me with Google Maps + Waze links.' },
  { label: '🏛️ Attractions', prompt: 'Find me 5 top tourist attractions near me with Google Maps + Waze links.' },
  { label: '🌳 Parks', prompt: 'Find me beautiful parks and gardens near me with Google Maps + Waze links.' },
  { label: '🍷 Nightlife', prompt: 'Where to go out tonight? Bars and pubs near me with Google Maps + Waze links.' }
];

export default function NearbyExplorer() {
  const { t, lang } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locName, setLocName] = useState<string>('');
  const [chatKey, setChatKey] = useState(0);
  const [autoMsg, setAutoMsg] = useState<string | undefined>();

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
    fetch(`/api/geocode?lat=${coords.lat}&lng=${coords.lng}&lang=${lang}`)
      .then(r => r.json())
      .then(d => setLocName([d.city, d.country].filter(Boolean).join(', ')))
      .catch(() => {});
  }, [coords, lang]);

  const prompts = lang === 'he' ? QUICK_PROMPTS_HE : QUICK_PROMPTS_EN;

  function quick(p: string) {
    setAutoMsg(p);
    setChatKey(k => k + 1);
  }

  const sysPrompt = `You are Trip.ly's local guide for ${locName || 'unknown location'} (lat=${coords?.lat}, lng=${coords?.lng}).

CRITICAL RULES:
1. Always recommend REAL specific places by their actual name in ${locName || 'the user\'s area'} — use your knowledge of this exact city/area.
2. For EVERY place, include BOTH a Google Maps link and a Waze link in this exact markdown format:
   - Google Maps: [📍 ${lang === 'he' ? 'מפות' : 'Maps'}](https://www.google.com/maps/search/?api=1&query=PLACE_NAME+CITY)
   - Waze: [🚗 Waze](https://waze.com/ul?q=PLACE_NAME&navigate=yes)
   Replace PLACE_NAME and CITY with the actual values, URL-encoded with + for spaces.
3. Format each place as: **Name** — short description, then both links on one line.
4. Use bullet points for the list. No long preamble.
5. Reply in ${lang === 'he' ? 'Hebrew (עברית)' : 'English'}.`;

  const initialMsg = coords
    ? (lang === 'he' ? `אני יודע שאתם ב**${locName || 'מיקום שלכם'}**. בחרו קטגוריה מהירה למטה או כתבו לי מה אתם מחפשים — אני אביא שמות מקומות אמיתיים עם לינקים לגוגל מפס ולוויז.` : `You're in **${locName || 'your location'}**. Pick a quick category below or tell me what you're looking for — I'll give real place names with Google Maps and Waze links.`)
    : (lang === 'he' ? 'שתפו את המיקום כדי לקבל המלצות.' : 'Share your location to get suggestions.');

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium">📍 {locName || (coords ? `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : (lang === 'he' ? 'מיקום לא ידוע' : 'unknown'))}</span>
        </div>
        <button onClick={getLocation} className="btn-ghost !py-2 text-sm">
          <Search className="h-4 w-4" /> {t('nearby.useLocation')}
        </button>
        {error && <span className="w-full text-xs text-red-600">{error}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map(p => (
          <button key={p.label} onClick={() => quick(p.prompt)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:ring-brand-200">
            {p.label}
          </button>
        ))}
      </div>

      <ChatBot
        key={`${chatKey}-${locName}`}
        systemPrompt={sysPrompt}
        initialAssistantMessage={initialMsg}
        autoSendMessage={autoMsg}
        context={{ location: locName, coords }}
        height={620}
      />
    </div>
  );
}
