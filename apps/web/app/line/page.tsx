import type { Metadata } from 'next';
import Link from 'next/link';
import { ScoreBadge } from '@hikkoshimap/ui';
import { SITE_URL } from '@/lib/site';
import { getLinesList } from '@/lib/db';
import { lineNameToSlug } from '@/lib/line-slug';

export const metadata: Metadata = {
  title: '路線別の治安ランキング',
  description: '東京都内の鉄道路線を一覧表示。各路線の駅数・平均治安偏差値を比較して、引越し先の路線選びに。',
  openGraph: {
    title: '路線別の治安ランキング',
    description: '東京都内の鉄道路線を一覧表示。各路線の駅数・平均治安偏差値を比較。',
    url: '/line',
  },
  alternates: {
    canonical: '/line',
  },
};

export default async function LinesPage() {
  const lines = await getLinesList();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '路線一覧' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-bold">路線別の治安ランキング</h1>
          <p className="mt-2 text-sm text-gray-500">
            東京都内の鉄道路線を一覧表示。各路線の駅数・平均治安偏差値を比較できます。
          </p>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {lines.map((line) => (
              <Link
                key={line.name}
                href={`/line/${lineNameToSlug(line.name)}`}
                className="flex items-center justify-between rounded-md border px-4 py-3 transition hover:bg-gray-50"
              >
                <div>
                  <span className="font-medium">{line.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {line.stationCount}駅
                  </span>
                </div>
                {line.avgScore != null && (
                  <ScoreBadge score={line.avgScore} />
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
