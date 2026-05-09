import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ location: null });
  const { data } = await supabase.from('user_locations').select('*').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ location: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });

  const { lat, lng, accuracy } = await req.json();
  if (typeof lat !== 'number' || typeof lng !== 'number') return NextResponse.json({ error: 'invalid coords' }, { status: 400 });

  let city = '', country = '', display = '';
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`, {
      headers: { 'User-Agent': 'Tripmly/1.0 (https://tripmly.vercel.app)' },
      signal: AbortSignal.timeout(7000)
    });
    if (r.ok) {
      const d = await r.json();
      const a = d.address || {};
      city = a.city || a.town || a.village || a.suburb || '';
      country = a.country || '';
      display = d.display_name || '';
    }
  } catch {}

  const { error } = await supabase.from('user_locations').upsert({
    user_id: user.id,
    lat,
    lng,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    city,
    country,
    display,
    updated_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, city, country });
}
