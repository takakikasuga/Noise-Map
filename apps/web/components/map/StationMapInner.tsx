'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { useState, useEffect, useCallback } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import { SCORE_MAX } from '@/lib/constants';

// Fix default marker icons for webpack/Next.js bundling
L.Icon.Default.mergeOptions({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
});

interface AreaProperties {
  areaName: string;
  nameEn: string;
  score: number;
}

function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(SCORE_MAX, score));
  const hue = (clamped / SCORE_MAX) * 120;
  return `hsl(${hue}, 70%, 45%)`;
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

interface StationMapInnerProps {
  lat: number;
  lng: number;
  stationName: string;
  zoom?: number;
}

export default function StationMapInner({
  lat,
  lng,
  stationName,
  zoom = 15,
}: StationMapInnerProps) {
  const [areaData, setAreaData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/api/area-geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setAreaData(data as FeatureCollection);
        }
      })
      .catch(() => {});
  }, []);

  const style = useCallback((feature: Feature | undefined) => {
    const score = (feature?.properties as AreaProperties | undefined)?.score ?? 50;
    return {
      fillColor: scoreToColor(score),
      fillOpacity: 0.45,
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
    <div className="h-[300px] sm:h-[400px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {areaData && (
          <>
            <GeoJSON data={areaData} style={style} onEachFeature={onEachFeature} />
            <Legend />
          </>
        )}
        <Marker position={[lat, lng]}>
          <Popup>{stationName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
