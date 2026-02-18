import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { SafetyScore } from '@hikkoshimap/shared';
import type { HazardData } from '@hikkoshimap/shared';
import { TOKYO_MUNICIPALITIES } from '@hikkoshimap/shared';
import { ScoreBadge } from '@hikkoshimap/ui';
import {
  getAllStations,
  getStationBySlug,
  getStationSafety,
  getStationHazard,
  getStationCount,
  getNearbyAreas,
} from '@/lib/db';
import { SITE_URL } from '@/lib/site';
import { SafetySection } from '@/components/station/SafetySection';
import { HazardSection } from '@/components/station/HazardSection';
import { NearbyAreasSection } from '@/components/station/NearbyAreasSection';
import { StationMap } from '@/components/map/StationMap';
import { UgcList } from '@/components/ugc/UgcList';

/** SSG: 全駅のスラッグを生成 */
export async function generateStaticParams() {
  const stations = await getAllStations();
  return stations.map((s) => ({ slug: (s as { nameEn: string }).nameEn }));
}

/** 動的メタデータ生成 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = await getStationBySlug(slug);

  if (!station) {
    return { title: '駅が見つかりません' };
  }

  const name = station.name as string;
  const municipalityName = station.municipalityName as string;

  const title = `${name}駅の治安・住環境リスク`;
  const description = `${name}駅（${municipalityName}）周辺の治安・災害リスクを客観データで評価。犯罪件数・災害リスクデータを掲載。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/station/${slug}`,
    },
    alternates: {
      canonical: `/station/${slug}`,
    },
  };
}

export default async function StationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const station = await getStationBySlug(slug);

  if (!station) {
    notFound();
  }

  const stationId = station.id as string;

  const [safetyData, hazardData, nearbyAreas, stationCount] = await Promise.all([
    getStationSafety(stationId),
    getStationHazard(stationId),
    getNearbyAreas(station.lat as number, station.lng as number),
    getStationCount(),
  ]);

  const name = station.name as string;
  const municipalityName = station.municipalityName as string;
  const lines = (station.lines as string[]) ?? [];
  const lat = station.lat as number;
  const lng = station.lng as number;

  // SafetySection に渡すデータ: クライアント送信量を最小化 (server-serialization)
  const safetyForClient = safetyData.map((d) => {
    const s = d as unknown as SafetyScore;
    return {
      year: s.year,
      score: s.score,
      rank: s.rank,
      totalCrimes: s.totalCrimes,
      crimesViolent: s.crimesViolent,
      crimesAssault: s.crimesAssault,
      crimesTheft: s.crimesTheft,
      crimesIntellectual: s.crimesIntellectual,
      crimesOther: s.crimesOther,
      previousYearTotal: s.previousYearTotal,
    };
  });

  const latestSafety = safetyForClient.length > 0 ? safetyForClient[0] : null;

  // JSON-LD 構造化データ
  const citySlug = TOKYO_MUNICIPALITIES.find((m) => m.name === municipalityName)?.nameEn;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${name}駅`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: municipalityName,
      addressRegion: '東京都',
      addressCountry: 'JP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      ...(citySlug
        ? [{ '@type': 'ListItem', position: 2, name: municipalityName, item: `${SITE_URL}/city/${citySlug}` }]
        : []),
      { '@type': 'ListItem', position: citySlug ? 3 : 2, name: `${name}駅` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="space-y-8">
        {/* 駅ヘッダー */}
        <section>
          <h1 className="text-3xl font-bold">{name}駅</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {municipalityName}
            </span>
            {lines.map((line) => (
              <span
                key={line}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
              >
                {line}
              </span>
            ))}
          </div>
          {hazardData && (
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">災害</span>
              <ScoreBadge score={(hazardData as unknown as HazardData).score} />
            </div>
          )}
        </section>

        {/* 住民の声（閲覧のみ） */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">周辺の口コミ</h2>
          <UgcList
            areaNameEns={(nearbyAreas as { nameEn: string }[]).map((a) => a.nameEn)}
            refreshKey={0}
          />
        </section>

        {/* 周辺エリアの治安（丁目別犯罪ランキング） */}
        <section className="rounded-lg border bg-white p-6">
          <NearbyAreasSection areas={nearbyAreas as { areaName: string; nameEn: string; municipalityName: string; totalCrimes: number; score: number; rank: number }[]} />
        </section>

        {/* 治安セクション（参考: 市区町村全体） */}
        <section className="rounded-lg border bg-white p-6">
          <div className="mb-3 rounded-md border-l-4 border-blue-400 bg-blue-50 p-3 text-sm text-blue-800">
            この偏差値は駅周辺（半径1km以内）のエリア犯罪率を集約した値です。
            駅周辺の詳細は上の「周辺エリアの治安」をご確認ください。
          </div>
          {safetyForClient.length > 0 ? (
            <SafetySection data={safetyForClient} totalCount={stationCount} />
          ) : (
            <div>
              <h2 className="text-xl font-semibold">治安</h2>
              <p className="mt-2 text-gray-400">治安データは準備中です</p>
            </div>
          )}
        </section>

        {/* 災害リスクセクション */}
        <section className="rounded-lg border bg-white p-6">
          <HazardSection data={hazardData as unknown as HazardData | null} />
        </section>


        {/* 周辺マップ */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">周辺マップ</h2>
          <StationMap lat={lat} lng={lng} stationName={name} />
        </section>
      </div>
    </>
  );
}
