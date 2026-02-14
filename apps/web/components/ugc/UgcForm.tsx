'use client';

interface UgcFormProps {
  stationId: string;
}

/**
 * 口コミ投稿フォーム
 * 匿名で駅の住環境に関する口コミを投稿
 */
export function UgcForm({ stationId }: UgcFormProps) {
  return (
    <form className="space-y-4">
      <input type="hidden" name="stationId" value={stationId} />
      <div>
        <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
        <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="safety">治安</option>
          <option value="noise">騒音</option>
          <option value="community">コミュニティ</option>
          <option value="vibe">雰囲気</option>
          <option value="other">その他</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">口コミ</label>
        <textarea
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          rows={4}
          placeholder="この駅周辺の住環境について教えてください..."
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        投稿する
      </button>
    </form>
  );
}
