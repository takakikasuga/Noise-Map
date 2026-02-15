import Link from 'next/link';
import { getStationListForSearch, getStationListForMap, getTopStations, getBottomStations } from '@/lib/db';
import { SearchBar } from '@/components/ui/SearchBar';
import { OverviewMap } from '@/components/map/OverviewMap';

export default async function HomePage() {
  const [stations, mapStations, topStations, bottomStations] = await Promise.all([
    getStationListForSearch(),
    getStationListForMap(),
    getTopStations(5),
    getBottomStations(5),
  ]);

  return (
    <div className="space-y-12">
      {/* ヒーローセクション */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight">
          ヒッコシノイズ
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          東京都の住環境リスクを、忖度なく可視化する。
        </p>
        <p className="mt-2 text-sm text-gray-500">
          約{stations.length}駅の治安・災害・街の雰囲気を客観データで評価
        </p>
      </section>

      {/* 検索バー */}
      <section className="mx-auto max-w-xl">
        <SearchBar stations={stations as { name: string; nameEn: string }[]} />
      </section>

      {/* ランキングセクション */}
      <section className="grid gap-8 md:grid-cols-2">
        {/* 安全な駅 TOP 5 */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-green-700">安全な駅 TOP 5</h2>
          <ol className="space-y-3">
            {topStations.map((station, i) => (
              <li key={station.nameEn}>
                <Link
                  href={`/station/${station.nameEn}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                      {i + 1}
                    </span>
                    <span className="font-medium">{station.name}駅</span>
                  </span>
                  <span className="text-sm text-green-600 font-semibold">{station.score.toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* 注意が必要な駅 TOP 5 */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-700">注意が必要な駅 TOP 5</h2>
          <ol className="space-y-3">
            {bottomStations.map((station, i) => (
              <li key={station.nameEn}>
                <Link
                  href={`/station/${station.nameEn}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800">
                      {i + 1}
                    </span>
                    <span className="font-medium">{station.name}駅</span>
                  </span>
                  <span className="text-sm text-red-600 font-semibold">{station.score.toFixed(1)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 東京都全域 駅マップ */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">東京都 駅マップ</h2>
        <p className="mb-4 text-sm text-gray-500">駅をクリックすると詳細ページに移動できます</p>
        <OverviewMap stations={mapStations as { name: string; nameEn: string; lat: number; lng: number }[]} />
      </section>
    </div>
  );
}
