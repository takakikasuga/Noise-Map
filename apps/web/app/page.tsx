// トップページ：検索 + 東京都マップ
export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          ヒッコシノイズ
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          東京都の住環境リスクを、忖度なく可視化する。
        </p>
        <p className="mt-2 text-sm text-gray-500">
          約800駅の治安・災害・街の雰囲気を客観データ＋住民の声で評価
        </p>
      </section>

      {/* 検索バー（プレースホルダー） */}
      <section className="mx-auto max-w-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="駅名を入力して検索..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </section>

      {/* 地図プレースホルダー */}
      <section className="rounded-lg border bg-white p-8 text-center text-gray-400">
        <p>東京都マップ（Leaflet）がここに表示されます</p>
      </section>
    </div>
  );
}
