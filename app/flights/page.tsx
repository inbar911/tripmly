import FlightSearch from '@/components/FlightSearch';
import { Plane } from 'lucide-react';

export const metadata = { title: 'Flights — Trip.ly' };

export default function FlightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Flights</h1>
          <p className="text-sm text-slate-600">150 countries · El Al, Arkia, Israir + global carriers</p>
        </div>
      </div>
      <FlightSearch />
    </div>
  );
}
