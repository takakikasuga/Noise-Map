'use client';

interface UgcListProps {
  stationId: string;
}

/**
 * 口コミ一覧コンポーネント
 * Supabase からCSRで口コミを取得・表示
 */
export function UgcList({ stationId }: UgcListProps) {
  // TODO: Supabase から口コミを取得
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">口コミ一覧</h3>
      <p className="text-gray-400">stationId: {stationId} の口コミを表示</p>
    </div>
  );
}
