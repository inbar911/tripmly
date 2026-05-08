import RoadTripPlanner from '@/components/RoadTripPlanner';
import { Truck } from 'lucide-react';

export const metadata = { title: 'Road Trip — Trip.ly' };

export default function RoadTripPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Road Trip</h1>
          <p className="text-sm text-slate-600">Plan a jeep trip from your location with AI</p>
        </div>
      </div>
      <RoadTripPlanner />
    </div>
  );
}
