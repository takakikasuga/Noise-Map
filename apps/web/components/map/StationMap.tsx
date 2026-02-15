'use client';

import dynamic from 'next/dynamic';

const StationMapInner = dynamic(() => import('./StationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" />
  ),
});

interface StationMapProps {
  lat: number;
  lng: number;
  stationName: string;
  zoom?: number;
}

/**
 * 駅周辺の地図コンポーネント
 * Leaflet + OpenStreetMap を使用
 */
export function StationMap({ lat, lng, stationName, zoom = 15 }: StationMapProps) {
  return <StationMapInner lat={lat} lng={lng} stationName={stationName} zoom={zoom} />;
}
