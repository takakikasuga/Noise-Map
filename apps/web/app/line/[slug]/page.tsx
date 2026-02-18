import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ScoreBadge } from '@hikkoshimap/ui';
import { SITE_URL } from '@/lib/site';
import { getLinesList, getStationsByLine } from '@/lib/db';
import { slugToLineName } from '@/lib/line-slug';

interface LineStation {
  id: string;
  name: string;
  nameEn: string;
  municipalityName: string;
  lines: string[];
  safetyScore: number | null;
  safetyRank: number | null;
  totalCrimes: number;
}

/**
 * SSG をスキップし ISR に委譲。
 * ビルド時に全路線分の Supabase リクエストが集中すると 500 エラーになるため、
 * 空配列を返してオンデマンド生成 + revalidate でキャッシュする。
 */
export async function generateStaticParams() {
  return [];
}

export const revalidate = 86400; // 24時間キャッシュ

/** 動的メタデータ生成 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lineName = slugToLineName(slug);

  const title = `${lineName}の治安ランキング`;
  const description = `${lineName}沿線の駅を治安偏差値でランキング。犯罪件数・治安スコアを客観データで比較。引越し先選びの参考に。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/line/${slug}`,
    },
    alternates: {
      canonical: `/line/${slug}`,
    },
  };
}

export default async function LinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lineName = slugToLineName(slug);

  const stations = (await getStationsByLine(lineName)) as unknown as LineStation[];

  if (stations.length === 0) {
    notFound();
  }

  // サマリー計算
  const scores = stations
    .map((s) => s.safetyScore)
    .filter((s): s is number => s != null);
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const totalCrimes = stations.reduce((sum, s) => sum + s.totalCrimes, 0);

  // JSON-LD ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${lineName}の治安ランキング`,
    numberOfItems: stations.length,
    itemListElement: stations.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${s.name}駅`,
      url: `${SITE_URL}/station/${s.nameEn}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '路線一覧', item: `${SITE_URL}/line` },
      { '@type': 'ListItem', position: 3, name: lineName },
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
        {/* ヘッダー */}
        <section>
          <h1 className="text-3xl font-bold">{lineName}の治安ランキング</h1>
          <p className="mt-2 text-sm text-gray-500">
            {lineName}沿線の駅を治安偏差値順で表示しています。
          </p>
        </section>

        {/* サマリー */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">路線サマリー</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 tabular-nums">
            <div>
              <p className="text-sm text-gray-500">駅数</p>
              <p className="text-2xl font-bold">{stations.length}</p>
            </div>
            {avgScore != null && (
              <div>
                <p className="text-sm text-gray-500">平均治安偏差値</p>
                <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">犯罪件数合計</p>
              <p className="text-2xl font-bold">{totalCrimes.toLocaleString()}件</p>
            </div>
          </div>
        </section>

        {/* 駅ランキング */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">駅別治安ランキング</h2>
          <div className="space-y-2">
            {stations.map((station, i) => (
              <Link
                key={station.nameEn}
                href={`/station/${station.nameEn}`}
                className="flex items-center justify-between rounded-md border px-4 py-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium">{station.name}駅</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {station.municipalityName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {station.totalCrimes > 0 && (
                    <span className="text-xs text-gray-400">
                      {station.totalCrimes.toLocaleString()}件
                    </span>
                  )}
                  {station.safetyScore != null && (
                    <ScoreBadge score={station.safetyScore} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
