'use client';

import dynamic from 'next/dynamic';

// Leaflet は SSR 非対応のため動的インポート
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

interface StationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
}

/**
 * 駅周辺の地図コンポーネント
 * Leaflet + OpenStreetMap を使用
 */
export function StationMap({ lat, lng, zoom = 15 }: StationMapProps) {
  return (
    <div className="h-[400px] w-full rounded-lg border bg-gray-100">
      <p className="flex h-full items-center justify-center text-gray-400">
        地図コンポーネント（{lat}, {lng}, zoom: {zoom}）
      </p>
    </div>
  );
}
