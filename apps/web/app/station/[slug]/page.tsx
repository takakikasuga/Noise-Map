// 駅ページ（SSG、約800ページ自動生成）

// SSG用パラメータ生成スタブ
export async function generateStaticParams() {
  // TODO: Supabase から全駅のスラッグを取得
  // 開発時はダミーデータを返す
  return [
    { slug: 'shinjuku' },
    { slug: 'shibuya' },
    { slug: 'ikebukuro' },
  ];
}

// メタデータ生成
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // TODO: Supabase から駅名を取得
  return {
    title: `${slug} 駅の住環境リスク`,
    description: `${slug} 駅周辺の治安・災害リスク・街の雰囲気を客観データで評価`,
  };
}

export default async function StationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="space-y-8">
      {/* 駅ヘッダー */}
      <section>
        <h1 className="text-3xl font-bold">{slug} 駅</h1>
        <p className="mt-2 text-gray-600">住環境リスク情報</p>
      </section>

      {/* ノイズスコア（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">ノイズスコア</h2>
        <p className="mt-2 text-gray-400">スコア表示がここに入ります</p>
      </section>

      {/* 地図（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">周辺マップ</h2>
        <p className="mt-2 text-gray-400">Leaflet 地図がここに表示されます</p>
      </section>

      {/* 治安セクション（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">治安</h2>
        <p className="mt-2 text-gray-400">治安データがここに表示されます</p>
      </section>

      {/* 災害セクション（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">災害リスク</h2>
        <p className="mt-2 text-gray-400">災害データがここに表示されます</p>
      </section>

      {/* 雰囲気セクション（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">街の雰囲気</h2>
        <p className="mt-2 text-gray-400">雰囲気データがここに表示されます</p>
      </section>

      {/* 口コミセクション（プレースホルダー） */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">住民の声</h2>
        <p className="mt-2 text-gray-400">口コミがここに表示されます</p>
      </section>
    </div>
  );
}
