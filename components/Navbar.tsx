'use client';
import Link from 'next/link';
import { Plane, MapPin, Truck, LayoutDashboard, Sparkles, Bike, Footprints } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useI18n } from './I18nProvider';
import LangToggle from './LangToggle';

export default function Navbar() {
  const path = usePathname();
  const { t } = useI18n();
  const links = [
    { href: '/flights', label: t('nav.flights'), icon: Plane },
    { href: '/nearby', label: t('nav.nearby'), icon: MapPin },
    { href: '/roadtrip', label: t('nav.roadtrip'), icon: Truck },
    { href: '/bike', label: t('nav.bike'), icon: Bike },
    { href: '/hike', label: t('nav.hike'), icon: Footprints },
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard }
  ];
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
        <div className="flex items-center gap-1">
          <LangToggle />
          <Link href="/auth" className="btn-primary !py-2 !px-4 text-sm">{t('cta.signin')}</Link>
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-slate-100 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium ${path === href ? 'text-brand-700' : 'text-slate-500'}`}>
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
