'use client';

import { useState } from 'react';
import { UgcForm } from './UgcForm';
import { UgcList } from './UgcList';

interface UgcSectionProps {
  areaNameEn?: string;
  nearbyAreas?: { areaName: string; nameEn: string }[];
}

export function UgcSection({ areaNameEn, nearbyAreas }: UgcSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Collect area name_en values for list query
  const areaNameEns = nearbyAreas?.map((a) => a.nameEn);

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 p-5">
        <h3 className="mb-4 text-base font-semibold text-gray-800">あなたの体験を教えてください</h3>
        <UgcForm
          areaNameEn={areaNameEn}
          nearbyAreas={nearbyAreas}
          onPosted={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-800">みんなの口コミ</h3>
        <UgcList
          areaNameEn={areaNameEn}
          areaNameEns={areaNameEns}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
