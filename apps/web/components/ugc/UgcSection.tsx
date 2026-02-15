'use client';

import { useState } from 'react';
import { UgcForm } from './UgcForm';
import { UgcList } from './UgcList';

interface UgcSectionProps {
  stationId?: string;
  areaNameEn?: string;
}

export function UgcSection({ stationId, areaNameEn }: UgcSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <UgcList stationId={stationId} areaNameEn={areaNameEn} refreshKey={refreshKey} />
      <div className="border-t pt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-500">口コミを投稿</h3>
        <UgcForm stationId={stationId} areaNameEn={areaNameEn} onPosted={() => setRefreshKey((k) => k + 1)} />
      </div>
    </div>
  );
}
