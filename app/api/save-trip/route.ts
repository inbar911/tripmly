import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const body = await req.json();
  const { error } = await supabase.from('trips').insert({
    user_id: user.id,
    type: body.type,
    title: body.title,
    payload: body.payload
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ trips: [] });
  const { data } = await supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json({ trips: data || [] });
}
