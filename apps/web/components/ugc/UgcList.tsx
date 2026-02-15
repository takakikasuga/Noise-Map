'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UgcPost {
  id: string;
  content: string;
  category: string;
  rating: number | null;
  created_at: string;
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
  stationId?: string;
  areaNameEn?: string;
  refreshKey: number;
}

export function UgcList({ stationId, areaNameEn, refreshKey }: UgcListProps) {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from('ugc_posts')
      .select('id, content, category, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (stationId) {
      query = query.eq('station_id', stationId);
    } else if (areaNameEn) {
      query = query.eq('area_name_en', areaNameEn);
    }

    query.then(({ data }) => {
      setPosts((data ?? []) as UgcPost[]);
      setLoading(false);
    });
  }, [stationId, areaNameEn, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-md bg-gray-100 h-20" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        まだ口コミはありません。最初の投稿をしてみましょう！
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">{posts.length}件の口コミ</p>
      <div className="divide-y">
        {posts.map((post) => {
          const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS.other;
          return (
            <div key={post.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                  {cat.label}
                </span>
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
