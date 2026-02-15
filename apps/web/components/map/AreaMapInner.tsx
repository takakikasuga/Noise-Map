'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AreaProperties {
  areaName: string;
  nameEn: string;
  score: number;
}

/**
 * 偏差値 → HSL カラー
 * 実データ分布: min=0, median=52.2, max=54.9
 * 0 → 赤(hue=0), ~27 → 黄(hue=60), 55 → 緑(hue=120)
 */
function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(55, score));
  const hue = (clamped / 55) * 120;
  return `hsl(${hue}, 70%, 45%)`;
}

/** 凡例 */
function Legend() {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '');
      div.style.cssText =
        'background:white;padding:8px 12px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-size:11px;line-height:1.4;';
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px;">治安偏差値</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span>危険</span>
          <div style="width:100px;height:12px;border-radius:3px;background:linear-gradient(to right,hsl(0,70%,45%),hsl(60,70%,45%),hsl(120,70%,45%));"></div>
          <span>安全</span>
        </div>
        <div style="display:flex;justify-content:space-between;width:100px;margin-left:20px;">
          <span>0</span><span>27</span><span>55</span>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

const SCORE_RANGES = [
  { label: 'すべて', min: 0, max: 55 },
  { label: '〜30（危険）', min: 0, max: 30 },
  { label: '30〜40', min: 30, max: 40 },
  { label: '40〜45', min: 40, max: 45 },
  { label: '45〜50', min: 45, max: 50 },
  { label: '50〜55（安全）', min: 50, max: 55 },
] as const;

const TOKYO_CENTER: [number, number] = [35.682, 139.764];
const DEFAULT_ZOOM = 11;

export default function AreaMapInner() {
  const [allData, setAllData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState(0); // index into SCORE_RANGES

  useEffect(() => {
    fetch('/api/area-geojson', { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data) => {
        setAllData(data as FeatureCollection);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredData = useMemo<FeatureCollection | null>(() => {
    if (!allData) return null;
    const range = SCORE_RANGES[activeRange];
    if (range.min === 0 && range.max === 55) return allData;

    return {
      type: 'FeatureCollection',
      features: allData.features.filter((f) => {
        const score = (f.properties as AreaProperties).score;
        return score >= range.min && score < range.max;
      }),
    } as FeatureCollection;
  }, [allData, activeRange]);

  const matchCount = filteredData?.features.length ?? 0;

  const style = useCallback((feature: Feature | undefined) => {
    const score = (feature?.properties as AreaProperties | undefined)?.score ?? 50;
    return {
      fillColor: scoreToColor(score),
      fillOpacity: 0.5,
      color: '#666',
      weight: 0.5,
    };
  }, []);

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const props = feature.properties as AreaProperties;
      layer.bindPopup(
        `<div style="text-align:center;">
          <a href="/area/${props.nameEn}" style="font-weight:600;color:#2563eb;">${props.areaName}</a>
          <div style="margin-top:4px;font-size:13px;">偏差値 <strong>${props.score.toFixed(1)}</strong></div>
        </div>`,
      );
    },
    [],
  );

  return (
    <div>
      {/* フィルタ UI */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SCORE_RANGES.map((range, i) => (
          <button
            key={i}
            onClick={() => setActiveRange(i)}
            className={`rounded-full px-3 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeRange === i
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {range.label}
          </button>
        ))}
        {!loading && (
          <span className="text-xs text-gray-400">{matchCount.toLocaleString()} エリア</span>
        )}
      </div>

      {loading && (
        <div className="mb-2 text-sm text-gray-400">エリアデータを読み込み中...</div>
      )}
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
          {filteredData && (
            <>
              <GeoJSON key={activeRange} data={filteredData} style={style} onEachFeature={onEachFeature} />
              <Legend />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
