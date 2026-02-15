import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { AreaSafety } from '@hikkoshinoise/shared';
import { TOKYO_MUNICIPALITIES } from '@hikkoshinoise/shared';
import { ScoreGauge } from '@hikkoshinoise/ui';
import {
  getAllAreas,
  getAreaBySlug,
  getAreaSafety,
} from '@/lib/db';
import { SafetySection } from '@/components/station/SafetySection';
import { StationMap } from '@/components/map/StationMap';
import { UgcSection } from '@/components/ugc/UgcSection';

/** SSG: 全エリアのスラッグを生成 */
export async function generateStaticParams() {
  const areas = await getAllAreas();
  return areas.map((a) => ({ slug: (a as { nameEn: string }).nameEn }));
}

/** 動的メタデータ生成 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);

  if (!area) {
    return { title: 'エリアが見つかりません' };
  }

  const areaName = area.areaName as string;
  const municipalityName = area.municipalityName as string;
  const score = area.score as number;

  const title = `${areaName}の治安情報・犯罪データ`;
  const description = `${areaName}（${municipalityName}）の治安偏差値${score.toFixed(1)}。犯罪件数・種別の推移を客観データで評価。引越し前に知りたい治安情報を掲載。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/area/${slug}`,
    },
    alternates: {
      canonical: `/area/${slug}`,
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // async-parallel: slug === nameEn なので並列フェッチ可能
  const [area, safetyData] = await Promise.all([
    getAreaBySlug(slug),
    getAreaSafety(slug),
  ]);

  if (!area) {
    notFound();
  }

  const areaName = area.areaName as string;
  const municipalityName = area.municipalityName as string;
  const lat = area.lat as number | null;
  const lng = area.lng as number | null;

  // server-serialization: クライアント送信量を最小化
  const safetyForClient = safetyData.map((d) => {
    const s = d as unknown as AreaSafety;
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: areaName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: municipalityName,
      addressRegion: '東京都',
      addressCountry: 'JP',
    },
    ...(lat != null && lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: lat,
            longitude: lng,
          },
        }
      : {}),
  };

  const citySlug = TOKYO_MUNICIPALITIES.find((m) => m.name === municipalityName)?.nameEn;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://hikkoshinoise.com' },
      ...(citySlug
        ? [{ '@type': 'ListItem', position: 2, name: municipalityName, item: `https://hikkoshinoise.com/city/${citySlug}` }]
        : []),
      { '@type': 'ListItem', position: citySlug ? 3 : 2, name: areaName },
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
        {/* エリアヘッダー */}
        <section>
          <h1 className="text-3xl font-bold">{areaName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {municipalityName}
            </span>
          </div>
        </section>

        {/* 偏差値サマリー */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">治安偏差値</h2>
          <div className="flex flex-wrap gap-8 justify-center">
            {latestSafety && (
              <ScoreGauge score={latestSafety.score} label="治安" size="lg" />
            )}
          </div>
          {!latestSafety && (
            <p className="text-center text-gray-400">偏差値データは準備中です</p>
          )}
        </section>

        {/* 治安セクション */}
        <section className="rounded-lg border bg-white p-6">
          {safetyForClient.length > 0 ? (
            <SafetySection data={safetyForClient} totalCount={5250} entityLabel="エリア" />
          ) : (
            <div>
              <h2 className="text-xl font-semibold">治安</h2>
              <p className="mt-2 text-gray-400">治安データは準備中です</p>
            </div>
          )}
        </section>

        {/* 周辺マップ */}
        {lat != null && lng != null && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">周辺マップ</h2>
            <StationMap lat={lat} lng={lng} stationName={areaName} />
          </section>
        )}

        {/* 住民の声（UGC） */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">住民の声</h2>
          <UgcSection areaNameEn={slug} />
        </section>
      </div>
    </>
  );
}
