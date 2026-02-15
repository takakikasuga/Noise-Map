'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { value: 'safety', label: '治安' },
  { value: 'noise', label: '騒音' },
  { value: 'community', label: 'コミュニティ' },
  { value: 'vibe', label: '雰囲気' },
  { value: 'other', label: 'その他' },
] as const;

interface UgcFormProps {
  stationId?: string;
  areaNameEn?: string;
  onPosted: () => void;
}

export function UgcForm({ stationId, areaNameEn, onPosted }: UgcFormProps) {
  const [category, setCategory] = useState<string>('safety');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = content.trim();
    if (trimmed.length < 10) {
      setError('10文字以上で入力してください。');
      return;
    }

    setSubmitting(true);

    const row: Record<string, unknown> = {
      category,
      content: trimmed,
      rating,
    };
    if (stationId) row.station_id = stationId;
    if (areaNameEn) row.area_name_en = areaNameEn;

    const { error: insertError } = await supabase
      .from('ugc_posts')
      .insert(row);

    setSubmitting(false);

    if (insertError) {
      setError('投稿に失敗しました。しばらくしてから再度お試しください。');
      return;
    }

    setContent('');
    setRating(null);
    setCategory('safety');
    setSuccess(true);
    onPosted();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">評価（任意）</label>
          <div className="flex gap-1 py-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                className={`text-xl transition ${
                  rating != null && star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">口コミ</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          rows={4}
          placeholder="この地域の住環境について教えてください（10文字以上）..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600">投稿しました！</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '投稿中...' : '投稿する'}
      </button>
    </form>
  );
}
