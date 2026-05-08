'use client';
import Link from 'next/link';
import { Plane, MapPin, Truck, Bike, ArrowRight } from 'lucide-react';
import { useI18n } from '@/components/I18nProvider';

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-16 text-white md:px-12 md:py-24">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">{t('app.tagline')}</h1>
          <p className="mt-4 text-lg text-brand-100 md:text-xl">{t('app.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/flights" className="btn-primary bg-white !text-brand-700 hover:bg-brand-50">{t('cta.planFlight')} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
            <Link href="/auth" className="btn-ghost !bg-white/10 !text-white !ring-white/20 hover:!bg-white/20">{t('cta.signinSave')}</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Feature href="/flights" icon={Plane} title={t('home.f1.title')} desc={t('home.f1.desc')} open={t('home.open')} />
        <Feature href="/nearby" icon={MapPin} title={t('home.f2.title')} desc={t('home.f2.desc')} open={t('home.open')} />
        <Feature href="/roadtrip" icon={Truck} title={t('home.f3.title')} desc={t('home.f3.desc')} open={t('home.open')} />
        <Feature href="/bike" icon={Bike} title={t('home.f4.title')} desc={t('home.f4.desc')} open={t('home.open')} />
      </section>

      <section className="card">
        <h2 className="text-2xl font-bold">{t('home.how.title')}</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['1', t('home.how.s1.t'), t('home.how.s1.d')],
            ['2', t('home.how.s2.t'), t('home.how.s2.d')],
            ['3', t('home.how.s3.t'), t('home.how.s3.d')]
          ].map(([n, ti, d]) => (
            <li key={n} className="rounded-xl bg-brand-50/50 p-4">
              <div className="text-sm font-bold text-brand-600">{t('home.step')} {n}</div>
              <div className="mt-1 font-semibold">{ti}</div>
              <div className="mt-1 text-sm text-slate-600">{d}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Feature({ href, icon: Icon, title, desc, open }: { href: string; icon: any; title: string; desc: string; open: string }) {
  return (
    <Link href={href} className="card group transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
        {open} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </div>
    </Link>
  );
}
