import Link from 'next/link';
import { TOKYO_MUNICIPALITIES } from '@hikkoshinoise/shared';
import { getStationListForSearch, getStationListForMap, getTopStations, getBottomStations, getAreaListForSearch } from '@/lib/db';
import { SearchBar } from '@/components/ui/SearchBar';
import { OverviewMap } from '@/components/map/OverviewMap';
import { AreaMap } from '@/components/map/AreaMap';

const WARDS = TOKYO_MUNICIPALITIES.filter((m) => m.name.endsWith('区'));
const TAMA = TOKYO_MUNICIPALITIES.filter((m) => !m.name.endsWith('区'));

export default async function HomePage() {
  const [stations, mapStations, topStations, bottomStations, areas] = await Promise.all([
    getStationListForSearch(),
    getStationListForMap(),
    getTopStations(5),
    getBottomStations(5),
    getAreaListForSearch(),
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
      <section id="areas" className="rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold">エリアから探す</h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-500">23区</h3>
            <div className="flex flex-wrap gap-2">
              {WARDS.map((m) => (
                <Link
                  key={m.nameEn}
                  href={`/city/${m.nameEn}`}
                  className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-blue-50 hover:border-blue-300"
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
                  className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-blue-50 hover:border-blue-300"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
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

      {/* 東京都全域 エリアマップ */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">東京都 治安エリアマップ</h2>
        <p className="mb-4 text-sm text-gray-500">エリアをクリックすると偏差値と詳細ページを確認できます</p>
        <AreaMap />
      </section>
    </div>
  );
}
