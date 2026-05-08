import Link from 'next/link';
import { Plane, MapPin, Truck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-16 text-white md:px-12 md:py-24">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Plan trips with AI.<br/>Fly. Explore. Drive.</h1>
          <p className="mt-4 text-lg text-brand-100 md:text-xl">150 countries, real airline links (El Al, Arkia, Israir & more), Google Maps activities, and a road-trip planner for your jeep — all in one app.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/flights" className="btn-primary bg-white !text-brand-700 hover:bg-brand-50">Plan a flight <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/auth" className="btn-ghost !bg-white/10 !text-white !ring-white/20 hover:!bg-white/20">Sign in to save trips</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature href="/flights" icon={Plane} title="Flights to 150 countries" desc="Chat with AI to plan your route. One click takes you to El Al, Arkia, Israir, Lufthansa, Turkish Airlines, and 3 metasearch engines." />
        <Feature href="/nearby" icon={MapPin} title="Nearby adventures" desc="Share your location. We surface restaurants, attractions, hikes, and nightlife around you with Google Maps." />
        <Feature href="/roadtrip" icon={Truck} title="Jeep road-trip planner" desc="Tell us your jeep size, group size, and where you're heading. AI maps the route, fuel stops, and overnight camps." />
      </section>

      <section className="card">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Tell the AI', 'Pick a mode and chat — destinations, budget, group size, dates.'],
            ['2', 'Get a real plan', 'Live deep-links to airlines, Google Maps places, and turn-by-turn routes.'],
            ['3', 'Save & go', 'Trips saved to your account. Pick up on any device.']
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-xl bg-brand-50/50 p-4">
              <div className="text-sm font-bold text-brand-600">Step {n}</div>
              <div className="mt-1 font-semibold">{t}</div>
              <div className="mt-1 text-sm text-slate-600">{d}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Feature({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string }) {
  return (
    <Link href={href} className="card group transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
        Open <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
