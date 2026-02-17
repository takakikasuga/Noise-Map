import type { Metadata } from 'next';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';
import { Header } from '@/components/ui/Header';
import './globals.css';

// サイト共通メタデータ
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
        <Header />
        {/* メインコンテンツ */}
        <main id="main" className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
        {/* フッター */}
        <footer className="border-t bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <Link href="/" className="text-lg font-bold">
                  ヒッコシマップ
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  東京の住環境リスクを忖度なく可視化
                </p>
              </div>
              <nav className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
                <Link href="/" className="text-gray-600 hover:text-blue-600">トップ</Link>
                <Link href="/#areas" className="text-gray-600 hover:text-blue-600">エリア</Link>
                <Link href="/line" className="text-gray-600 hover:text-blue-600">路線</Link>
                <Link href="/compare" className="text-gray-600 hover:text-blue-600">比較</Link>
                <Link href="/about/methodology" className="text-gray-600 hover:text-blue-600">データについて</Link>
                <Link href="/about/terms" className="text-gray-600 hover:text-blue-600">利用規約</Link>
                <Link href="/about/privacy" className="text-gray-600 hover:text-blue-600">プライバシーポリシー</Link>
              </nav>
            </div>
            <div className="mt-6 border-t pt-4 text-center text-xs text-gray-400">
              &copy; {new Date().getFullYear()} ヒッコシマップ
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
