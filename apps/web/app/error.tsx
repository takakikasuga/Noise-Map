'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-sm text-gray-500">ページの読み込み中に問題が発生しました。</p>
      <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">再読み込み</button>
    </div>
  );
}
