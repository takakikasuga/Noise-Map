'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">エラーが発生しました</h2>
          <p className="text-sm text-gray-500">予期しないエラーが発生しました。</p>
          <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">再読み込み</button>
        </div>
      </body>
    </html>
  );
}
