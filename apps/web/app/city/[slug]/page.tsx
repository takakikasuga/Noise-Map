import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOKYO_MUNICIPALITIES } from '@hikkoshinoise/shared';
import { ScoreBadge } from '@hikkoshinoise/ui';
import {
  getStationsByMunicipality,
  getAreasByMunicipality,
  getMunicipalityCrimeStats,
} from '@/lib/db';
import { AreaList } from '@/components/city/AreaList';

interface CityStation {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  lines: string[];
  municipalityName: string;
  safetyScore: number | null;
  safetyRank: number | null;
}

interface CityArea {
  areaName: string;
  nameEn: string;
  score: number;
  rank: number | null;
  totalCrimes: number;
}

interface CrimeStats {
  year: number;
  totalCrimes: number;
  previousYearTotal: number | null;
}

function findMunicipality(slug: string) {
  return TOKYO_MUNICIPALITIES.find((m) => m.nameEn === slug) ?? null;
}

/** SSG: 全市区町村のスラッグを生成 */
export async function generateStaticParams() {
  return TOKYO_MUNICIPALITIES.map((m) => ({ slug: m.nameEn }));
}

/** 動的メタデータ生成 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const muni = findMunicipality(slug);

  if (!muni) {
    return { title: '市区町村が見つかりません' };
  }

  const title = `${muni.name}の治安・住環境リスク`;
  const description = `東京都${muni.name}の治安情報を客観データで評価。犯罪件数の推移、駅別・エリア別の偏差値ランキングを掲載。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/city/${slug}`,
    },
    alternates: {
      canonical: `/city/${slug}`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const muni = findMunicipality(slug);

  if (!muni) {
    notFound();
  }

  const [rawStations, rawAreas, rawCrimeStats] = await Promise.all([
    getStationsByMunicipality(muni.name),
    getAreasByMunicipality(muni.name),
    getMunicipalityCrimeStats(muni.name),
  ]);

  const stations = rawStations as unknown as CityStation[];
  const areas = rawAreas as unknown as CityArea[];
  const crimeStats = rawCrimeStats as unknown as CrimeStats[];

  const latestStats = crimeStats.length > 0 ? crimeStats[0] : null;
  const delta =
    latestStats?.previousYearTotal != null
      ? latestStats.totalCrimes - latestStats.previousYearTotal
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `東京都${muni.name}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: muni.name,
      addressRegion: '東京都',
      addressCountry: 'JP',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://hikkoshinoise.com',
      },
      { '@type': 'ListItem', position: 2, name: muni.name },
    ],
  };

  // 安全エリア TOP 5（スコア降順 = そのまま先頭5件）
  const safeAreas = areas.slice(0, 5);
  // 注意エリア TOP 5（スコア昇順）
  const dangerousAreas = [...areas]
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5);

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
        {/* ヘッダー */}
        <section>
          <h1 className="text-3xl font-bold">{muni.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              東京都
            </span>
          </div>
        </section>

        {/* 犯罪統計サマリー */}
        {latestStats && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              犯罪統計（{latestStats.year}年）
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">犯罪件数合計</p>
                <p className="text-2xl font-bold">
                  {latestStats.totalCrimes.toLocaleString()}件
                </p>
              </div>
              {delta != null && (
                <div>
                  <p className="text-sm text-gray-500">前年比</p>
                  <p
                    className={`text-2xl font-bold ${delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta.toLocaleString()}件
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">駅数</p>
                <p className="text-2xl font-bold">{stations.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">エリア数</p>
                <p className="text-2xl font-bold">{areas.length}</p>
              </div>
            </div>
          </section>
        )}

        {/* 駅一覧 */}
        {stations.length > 0 && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">{muni.name}の駅</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {stations.map((station) => (
                <Link
                  key={station.nameEn}
                  href={`/station/${station.nameEn}`}
                  className="flex items-center justify-between rounded-md border px-4 py-3 transition hover:bg-gray-50"
                >
                  <div>
                    <span className="font-medium">
                      {station.name}駅
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(station.lines ?? [])
                        .slice(0, 2)
                        .join('・')}
                    </span>
                  </div>
                  {station.safetyScore !=
                    null && (
                    <span className="text-sm font-semibold text-blue-600">
                      偏差値{' '}
                      {(
                        station.safetyScore
                      ).toFixed(1)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* エリアランキング */}
        {areas.length > 0 && (
          <section className="grid gap-8 md:grid-cols-2">
            {/* 安全なエリア TOP 5 */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-green-700">
                安全なエリア TOP 5
              </h2>
              <ol className="space-y-2">
                {safeAreas.map((area, i) => (
                  <li key={area.nameEn}>
                    <Link
                      href={`/area/${area.nameEn}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 transition hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                          {i + 1}
                        </span>
                        <span className="text-sm">
                          {area.areaName}
                        </span>
                      </span>
                      <ScoreBadge score={area.score} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* 注意が必要なエリア TOP 5 */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-red-700">
                注意が必要なエリア TOP 5
              </h2>
              <ol className="space-y-2">
                {dangerousAreas.map((area, i) => (
                  <li key={area.nameEn}>
                    <Link
                      href={`/area/${area.nameEn}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 transition hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800">
                          {i + 1}
                        </span>
                        <span className="text-sm">
                          {area.areaName}
                        </span>
                      </span>
                      <ScoreBadge score={area.score} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
        {/* 全エリア一覧 */}
        {areas.length > 0 && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {muni.name}の全エリア（偏差値順）
            </h2>
            <AreaList areas={areas} />
          </section>
        )}
      </div>
    </>
  );
}
