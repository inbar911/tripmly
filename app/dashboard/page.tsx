import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plane, MapPin, Truck, ArrowRight } from 'lucide-react';

export const metadata = { title: 'My Trips — Trip.ly' };

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: trips } = await supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Trips</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      {(!trips || trips.length === 0) ? (
        <div className="card text-center">
          <p className="text-slate-600">No trips saved yet.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/flights" className="btn-primary"><Plane className="h-4 w-4" /> Plan a flight</Link>
            <Link href="/nearby" className="btn-ghost"><MapPin className="h-4 w-4" /> Explore nearby</Link>
            <Link href="/roadtrip" className="btn-ghost"><Truck className="h-4 w-4" /> Road trip</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((t: any) => {
            const Icon = t.type === 'flight' ? Plane : t.type === 'roadtrip' ? Truck : MapPin;
            return (
              <div key={t.id} className="card flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-semibold">{t.title}</h3>
                    <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500 capitalize">{t.type}</p>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-50 p-2 text-xs">{JSON.stringify(t.payload, null, 2)}</pre>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form action="/api/auth/signout" method="post">
        <button className="btn-ghost text-sm">Sign out</button>
      </form>
    </div>
  );
}
