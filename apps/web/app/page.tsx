import Link from 'next/link';
import { TOKYO_MUNICIPALITIES } from '@hikkoshimap/shared';
import { ScoreBadge } from '@hikkoshimap/ui';
import { getStationListForSearch, getStationListForMap, getTopAreas, getBottomAreas, getAreaListForSearch, getRecentUgcPosts } from '@/lib/db';
import { SearchBar } from '@/components/ui/SearchBar';
import { OverviewMap } from '@/components/map/OverviewMap';
import { AreaMap } from '@/components/map/AreaMap';

const WARDS = TOKYO_MUNICIPALITIES.filter((m) => m.name.endsWith('区'));
const TAMA = TOKYO_MUNICIPALITIES.filter((m) => !m.name.endsWith('区'));

export default async function HomePage() {
  const [stations, mapStations, topAreas, bottomAreas, areas, recentPosts] = await Promise.all([
    getStationListForSearch(),
    getStationListForMap(),
    getTopAreas(5),
    getBottomAreas(5),
    getAreaListForSearch(),
    getRecentUgcPosts(5),
  ]);

  return (
    <div className="space-y-12">
      {/* ヒーローセクション */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-balance">
          ヒッコシマップ
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          東京都の住環境リスクを、忖度なく可視化する。
        </p>
        <p className="mt-2 text-sm text-gray-500">
          約{stations.length}駅 + 約{areas.length}エリアの治安・災害・街の雰囲気を客観データで評価
        </p>
      </section>

      {/* 検索バー */}
      <section className="mx-auto max-w-xl">
        <SearchBar
          stations={stations as { name: string; nameEn: string }[]}
          areas={areas as { areaName: string; nameEn: string }[]}
          cities={TOKYO_MUNICIPALITIES.map((m) => ({ name: m.name, nameEn: m.nameEn }))}
        />
      </section>

      {/* エリアから探す */}
      <section id="areas" className="scroll-mt-20 rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold">エリアから探す</h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-500">23区</h3>
            <div className="flex flex-wrap gap-2">
              {WARDS.map((m) => (
                <Link
                  key={m.nameEn}
                  href={`/city/${m.nameEn}`}
                  className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-blue-50 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-500">多摩地域</h3>
            <div className="flex flex-wrap gap-2">
              {TAMA.map((m) => (
                <Link
                  key={m.nameEn}
                  href={`/city/${m.nameEn}`}
                  className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-blue-50 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* エリアランキング */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-green-700">安全なエリア TOP 5</h2>
          <ol className="space-y-3">
            {topAreas.map((area, i) => (
              <li key={area.nameEn}>
                <Link
                  href={`/area/${area.nameEn}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                      {i + 1}
                    </span>
                    <span className="font-medium">{area.areaName}</span>
                  </span>
                  <ScoreBadge score={area.score} />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-700">注意が必要なエリア TOP 5</h2>
          <ol className="space-y-3">
            {bottomAreas.map((area, i) => (
              <li key={area.nameEn}>
                <Link
                  href={`/area/${area.nameEn}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800">
                      {i + 1}
                    </span>
                    <span className="font-medium">{area.areaName}</span>
                  </span>
                  <ScoreBadge score={area.score} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 最新の口コミ */}
      {recentPosts.length > 0 && (
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">最新の口コミ</h2>
          <div className="divide-y">
            {recentPosts.map((post) => {
              const catMap: Record<string, { label: string; color: string }> = {
                safety: { label: '治安', color: 'bg-red-100 text-red-700' },
                noise: { label: '騒音', color: 'bg-purple-100 text-purple-700' },
                community: { label: 'コミュニティ', color: 'bg-blue-100 text-blue-700' },
                vibe: { label: '雰囲気', color: 'bg-green-100 text-green-700' },
                other: { label: 'その他', color: 'bg-gray-100 text-gray-700' },
              };
              const cat = catMap[post.category] ?? catMap.other;
              const linkHref = post.areaNameEn
                ? `/area/${post.areaNameEn}`
                : null;
              const linkLabel = post.areaName ?? post.areaNameEn;

              return (
                <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                      {cat.label}
                    </span>
                    {linkHref && linkLabel && (
                      <Link href={linkHref} className="text-xs text-blue-600 hover:underline">
                        {linkLabel}
                      </Link>
                    )}
                    {post.rating != null && (
                      <span className="text-sm">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={s <= post.rating! ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 東京都全域 駅マップ */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">東京都 駅マップ</h2>
        <p className="mb-4 text-sm text-gray-500">駅をクリックすると詳細ページに移動できます</p>
        <OverviewMap stations={mapStations as { name: string; nameEn: string; lat: number; lng: number; score: number | null }[]} />
      </section>

      {/* 東京都全域 エリアマップ */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">東京都 治安エリアマップ</h2>
        <p className="mb-4 text-sm text-gray-500">エリアをクリックすると偏差値と詳細ページを確認できます</p>
        <AreaMap />
      </section>
    </div>
  );
}
