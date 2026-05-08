'use client';
import Link from 'next/link';
import { Plane, MapPin, Truck, LayoutDashboard, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/flights', label: 'Flights', icon: Plane },
  { href: '/nearby', label: 'Nearby', icon: MapPin },
  { href: '/roadtrip', label: 'Road Trip', icon: Truck },
  { href: '/dashboard', label: 'My Trips', icon: LayoutDashboard }
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <Sparkles className="h-5 w-5" /> Trip.ly
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${path === href ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/auth" className="btn-primary !py-2 !px-4 text-sm">Sign in</Link>
      </div>
      <nav className="flex items-center justify-around border-t border-slate-100 bg-white/80 px-2 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium ${path === href ? 'text-brand-700' : 'text-slate-500'}`}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
