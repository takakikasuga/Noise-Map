'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Supabase レスポンス用の snake_case 型（共有型 UgcPost の DB 応答形式） */
interface UgcPost {
  id: string;
  content: string;
  category: string;
  rating: number | null;
  created_at: string;
  area_name_en: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  safety: { label: '治安', color: 'bg-red-100 text-red-700' },
  noise: { label: '騒音', color: 'bg-purple-100 text-purple-700' },
  community: { label: 'コミュニティ', color: 'bg-blue-100 text-blue-700' },
  vibe: { label: '雰囲気', color: 'bg-green-100 text-green-700' },
  other: { label: 'その他', color: 'bg-gray-100 text-gray-700' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  return `${months}ヶ月前`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

interface UgcListProps {
  areaNameEn?: string;
  areaNameEns?: string[];
  refreshKey: number;
}

export function UgcList({ areaNameEn, areaNameEns, refreshKey }: UgcListProps) {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);

  const areaNameEnsKey = JSON.stringify(areaNameEns);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from('ugc_posts')
      .select('id, content, category, rating, created_at, area_name_en')
      .order('created_at', { ascending: false })
      .limit(50);

    if (areaNameEn) {
      query = query.eq('area_name_en', areaNameEn);
    } else if (areaNameEns && areaNameEns.length > 0) {
      query = query.in('area_name_en', areaNameEns);
    }

    query.then(({ data }) => {
      setPosts((data ?? []) as UgcPost[]);
      setLoading(false);
    });
  }, [areaNameEn, areaNameEnsKey, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-24" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-8 6v-6h-2a4 4 0 0 1-4-4V10z" />
        </svg>
        <p className="text-base text-gray-400">まだ口コミはありません</p>
        <p className="text-sm text-gray-400">最初の口コミを投稿してみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V5z" />
        </svg>
        {posts.length}件の口コミ
      </p>
      <div className="space-y-3">
        {posts.map((post) => {
          const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS.other;
          return (
            <div key={post.id} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                  {cat.label}
                </span>
                {post.area_name_en && areaNameEns && (
                  <span className="text-xs text-gray-400">{post.area_name_en}</span>
                )}
                {post.rating != null && <Stars rating={post.rating} />}
                <span className="ml-auto text-xs text-gray-400">{relativeTime(post.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
