'use client';

/**
 * 駅名検索コンポーネント
 * テキスト入力 + サジェスト機能
 */
export function SearchBar() {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="駅名を入力して検索..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      {/* TODO: サジェストドロップダウン */}
    </div>
  );
}
