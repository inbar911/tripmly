'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const userIcon = L.divIcon({
  html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #2563eb"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
}

export type LeafletPlace = { id: string | number; name: string; lat: number; lng: number; tags?: Record<string, string> };

export default function LeafletMap({
  center,
  places = [],
  height = 380,
  zoom = 14
}: {
  center: { lat: number; lng: number };
  places?: LeafletPlace[];
  height?: number;
  zoom?: number;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height, width: '100%' }} scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter lat={center.lat} lng={center.lng} />
      <Marker position={[center.lat, center.lng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {places.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.name}</strong>
            {p.tags?.cuisine && <div>Cuisine: {p.tags.cuisine}</div>}
            {p.tags?.['addr:street'] && <div>{p.tags['addr:street']}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
