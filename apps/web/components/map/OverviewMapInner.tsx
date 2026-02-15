'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SCORE_MAX } from '@/lib/constants';

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
  score: number | null;
}

interface OverviewMapInnerProps {
  stations: StationPoint[];
}

function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(SCORE_MAX, score));
  const hue = (clamped / SCORE_MAX) * 120;
  return `hsl(${hue}, 70%, 45%)`;
}

function scoreToFill(score: number): string {
  const clamped = Math.max(0, Math.min(SCORE_MAX, score));
  const hue = (clamped / SCORE_MAX) * 120;
  return `hsl(${hue}, 70%, 55%)`;
}

function Legend() {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '');
      div.style.cssText =
        'background:white;padding:6px 10px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-size:10px;line-height:1.4;';
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;">治安偏差値</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span>危険</span>
          <div style="width:60px;height:10px;border-radius:3px;background:linear-gradient(to right,hsl(0,70%,45%),hsl(60,70%,45%),hsl(120,70%,45%));"></div>
          <span>安全</span>
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

/** 東京都の中心座標 */
const TOKYO_CENTER: [number, number] = [35.682, 139.764];
const DEFAULT_ZOOM = 11;

export default function OverviewMapInner({ stations }: OverviewMapInnerProps) {
  const [activeRange, setActiveRange] = useState(0);

  const filtered = useMemo(() => {
    const range = SCORE_RANGES[activeRange];
    if (range.min === 0 && range.max === 55) return stations;
    return stations.filter((s) => {
      if (s.score == null) return false;
      return s.score >= range.min && s.score < range.max;
    });
  }, [stations, activeRange]);

  return (
    <div>
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
        <span className="text-xs text-gray-400">{filtered.length} 駅</span>
      </div>

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
          {filtered.map((s) => {
            const score = s.score ?? 50;
            return (
              <CircleMarker
                key={s.nameEn}
                center={[s.lat, s.lng]}
                radius={6}
                pathOptions={{
                  color: scoreToColor(score),
                  fillColor: scoreToFill(score),
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <Link
                      href={`/station/${s.nameEn}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {s.name}駅
                    </Link>
                    {s.score != null && (
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        偏差値 <strong>{s.score.toFixed(1)}</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          <Legend />
        </MapContainer>
      </div>
    </div>
  );
}
