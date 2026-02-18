import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CompareContent } from './CompareContent';

export const metadata: Metadata = {
  title: 'エリア比較',
  description: '複数のエリアの住環境リスクを横並びで比較',
  alternates: {
    canonical: '/compare',
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
