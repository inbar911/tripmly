'use client';
import NearbyExplorer from '@/components/NearbyExplorer';
import { MapPin } from 'lucide-react';
import { useI18n } from '@/components/I18nProvider';

export default function NearbyPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('nearby.title')}</h1>
          <p className="text-sm text-slate-600">{t('nearby.subtitle')}</p>
        </div>
      </div>
      <NearbyExplorer />
    </div>
  );
}
