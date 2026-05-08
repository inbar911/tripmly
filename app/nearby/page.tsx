import NearbyExplorer from '@/components/NearbyExplorer';
import { MapPin } from 'lucide-react';

export const metadata = { title: 'Nearby — Trip.ly' };

export default function NearbyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Nearby</h1>
          <p className="text-sm text-slate-600">Activities, food & places around your current location</p>
        </div>
      </div>
      <NearbyExplorer />
    </div>
  );
}
