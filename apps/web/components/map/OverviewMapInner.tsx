'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Link from 'next/link';

// Fix default marker icons for webpack/Next.js bundling
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface StationPoint {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
}

interface OverviewMapInnerProps {
  stations: StationPoint[];
}

/** 東京都の中心座標 */
const TOKYO_CENTER: [number, number] = [35.682, 139.764];
const DEFAULT_ZOOM = 11;

export default function OverviewMapInner({ stations }: OverviewMapInnerProps) {
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={TOKYO_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((s) => (
          <CircleMarker
            key={s.nameEn}
            center={[s.lat, s.lng]}
            radius={5}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <Link
                href={`/station/${s.nameEn}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {s.name}駅
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
