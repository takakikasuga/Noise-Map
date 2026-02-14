import type { Metadata } from 'next';
import './globals.css';

// サイト共通メタデータ
export const metadata: Metadata = {
  title: {
    default: 'ヒッコシノイズ',
    template: '%s | ヒッコシノイズ',
  },
  description: '東京都全域の住環境リスク情報を駅単位で可視化。治安・災害・街の雰囲気を客観データで忖度なく提供。',
  keywords: ['引っ越し', '東京', '治安', '災害リスク', '住環境', '駅'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* ヘッダー */}
        <header className="border-b bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <a href="/" className="text-xl font-bold">
              ヒッコシノイズ
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-blue-600">トップ</a>
              <a href="/compare" className="hover:text-blue-600">比較</a>
            </nav>
          </div>
        </header>
        {/* メインコンテンツ */}
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
