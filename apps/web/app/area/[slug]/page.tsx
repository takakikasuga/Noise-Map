import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { AreaSafety, AreaVibeData } from '@hikkoshimap/shared';
import { TOKYO_MUNICIPALITIES } from '@hikkoshimap/shared';
import { ScoreBadge } from '@hikkoshimap/ui';
import {
  getAreaBySlug,
  getAreaSafety,
  getAreaVibe,
  getAreaCount,
  getNearbyStations,
} from '@/lib/db';
import { SITE_URL } from '@/lib/site';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SafetySection } from '@/components/station/SafetySection';
import { VibeSection } from '@/components/station/VibeSection';
import { StationMap } from '@/components/map/StationMap';
import { UgcSection } from '@/components/ugc/UgcSection';
import { NearbyStationsSection } from '@/components/station/NearbyStationsSection';

/**
 * SSG をスキップし全エリアページを ISR（オンデマンド生成）に委譲する。
 * Supabase 無料枠ではビルド時の同時接続数上限により 500 エラーが発生するため。
 * サイトマップは全 URL を返すので SEO への影響なし。
 */
export function generateStaticParams() {
  return [];
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
  const score = area.score as number | null;

  const title = `${areaName}の治安情報・犯罪データ`;
  const description = score
    ? `${areaName}（${municipalityName}）の治安偏差値${score.toFixed(1)}。犯罪件数・種別の推移を客観データで評価。引越し前に知りたい治安情報を掲載。`
    : `${areaName}（${municipalityName}）の治安情報。犯罪件数・種別の推移を客観データで評価。引越し前に知りたい治安情報を掲載。`;

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
  const [area, safetyData, areaCount] = await Promise.all([
    getAreaBySlug(slug),
    getAreaSafety(slug),
    getAreaCount(),
  ]);

  if (!area) {
    notFound();
  }

  const areaName = area.areaName as string;
  const municipalityName = area.municipalityName as string;
  const lat = area.lat as number | null;
  const lng = area.lng as number | null;

  // エリア座標がある場合のみ近くの駅を取得 + Vibeデータ並列フェッチ
  const [nearbyStations, vibeData] = await Promise.all([
    (lat != null && lng != null) ? getNearbyStations(lat, lng) : Promise.resolve([]),
    getAreaVibe(areaName),
  ]);

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
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      ...(citySlug
        ? [{ '@type': 'ListItem', position: 2, name: municipalityName, item: `${SITE_URL}/city/${citySlug}` }]
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
        {/* パンくずナビゲーション */}
        <Breadcrumb
          items={[
            { label: 'ホーム', href: '/' },
            ...(citySlug
              ? [{ label: municipalityName, href: `/city/${citySlug}` }]
              : []),
            { label: areaName },
          ]}
        />

        {/* エリアヘッダー */}
        <section>
          <h1 className="text-3xl font-bold">{areaName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {citySlug ? (
              <Link
                href={`/city/${citySlug}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                {municipalityName}
              </Link>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {municipalityName}
              </span>
            )}
          </div>
          {latestSafety && latestSafety.score != null ? (
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <span className="text-gray-500">治安</span>
              <ScoreBadge score={latestSafety.score} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">治安データなし</p>
          )}
        </section>

        {/* 住民の声（UGC） — スコア直後に配置し投稿率を最大化 */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">住民の声</h2>
          <UgcSection areaNameEn={slug} />
        </section>

        {/* 治安セクション */}
        <section className="rounded-lg border bg-white p-6">
          {safetyForClient.length > 0 ? (
            <SafetySection data={safetyForClient} totalCount={areaCount} entityLabel="エリア" />
          ) : (
            <div>
              <h2 className="text-xl font-semibold">治安</h2>
              <p className="mt-2 text-gray-400">治安データは準備中です</p>
            </div>
          )}
        </section>

        {/* 雰囲気セクション */}
        <section className="rounded-lg border bg-white p-6">
          {vibeData ? (
            <VibeSection data={vibeData as unknown as AreaVibeData} />
          ) : (
            <div>
              <h2 className="text-xl font-semibold">街の雰囲気</h2>
              <p className="mt-2 text-gray-400">雰囲気データは準備中です</p>
            </div>
          )}
        </section>

        {/* 近くの駅 */}
        <section className="rounded-lg border bg-white p-6">
          <NearbyStationsSection stations={nearbyStations as { name: string; nameEn: string; municipalityName: string }[]} />
        </section>

        {/* 周辺マップ */}
        {lat != null && lng != null && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">周辺マップ</h2>
            <StationMap lat={lat} lng={lng} stationName={areaName} />
          </section>
        )}

        {/* 比較ページ誘導 */}
        <div className="flex justify-center">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            他のエリアと比較する
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </>
  );
}
