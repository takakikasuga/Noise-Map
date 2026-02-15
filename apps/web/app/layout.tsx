import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

// サイト共通メタデータ
export const metadata: Metadata = {
  metadataBase: new URL('https://hikkoshimap.com'),
  title: {
    default: 'ヒッコシマップ',
    template: '%s | ヒッコシマップ',
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
      <head>
        <meta name="theme-color" content="#f9fafb" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">
          メインコンテンツへスキップ
        </a>
        {/* ヘッダー */}
        <header className="border-b bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">
              ヒッコシマップ
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">トップ</Link>
              <Link href="/#areas" className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">エリア</Link>
              <Link href="/compare" className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">比較</Link>
              <Link href="/about/methodology" className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">データについて</Link>
            </nav>
          </div>
        </header>
        {/* メインコンテンツ */}
        <main id="main" className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
