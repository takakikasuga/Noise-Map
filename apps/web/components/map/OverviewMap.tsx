'use client';

import dynamic from 'next/dynamic';

const OverviewMapInner = dynamic(() => import('./OverviewMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full animate-pulse rounded-lg bg-gray-100" />
  ),
});

interface StationPoint {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
}

interface OverviewMapProps {
  stations: StationPoint[];
}

export function OverviewMap({ stations }: OverviewMapProps) {
  return <OverviewMapInner stations={stations} />;
}
