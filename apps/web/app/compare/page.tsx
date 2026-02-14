// 比較ページ（2〜3駅横並び）

export const metadata = {
  title: '駅比較',
  description: '複数の駅の住環境リスクを横並びで比較',
};

export default function ComparePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">駅を比較する</h1>
        <p className="mt-2 text-gray-600">
          2〜3駅を選んで、住環境リスクを横並びで比較できます
        </p>
      </section>

      {/* 駅選択（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <p className="text-gray-400">駅選択UIがここに入ります</p>
      </section>

      {/* 比較テーブル（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <p className="text-gray-400">比較テーブルがここに表示されます</p>
      </section>
    </div>
  );
}
