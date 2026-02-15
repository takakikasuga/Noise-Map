'use client';

import dynamic from 'next/dynamic';

const AreaMapInner = dynamic(() => import('./AreaMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full animate-pulse rounded-lg bg-gray-100" />
  ),
});

export function AreaMap() {
  return <AreaMapInner />;
}
