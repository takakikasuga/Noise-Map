import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ページが見つかりません',
  description: 'お探しのページは存在しないか、移動した可能性があります。',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-bold text-gray-300">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        ページが見つかりません
      </h1>
      <p className="mt-3 text-gray-600">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          トップページへ戻る
        </Link>
        <Link
          href="/line"
          className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          路線から探す
        </Link>
      </div>
    </div>
  );
}
