'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  {
    value: 'safety',
    label: '治安',
    base: 'bg-red-100 text-red-700 border-red-200',
    selected: 'bg-red-600 text-white border-red-600',
  },
  {
    value: 'noise',
    label: '騒音',
    base: 'bg-purple-100 text-purple-700 border-purple-200',
    selected: 'bg-purple-600 text-white border-purple-600',
  },
  {
    value: 'community',
    label: 'コミュニティ',
    base: 'bg-blue-100 text-blue-700 border-blue-200',
    selected: 'bg-blue-600 text-white border-blue-600',
  },
  {
    value: 'vibe',
    label: '雰囲気',
    base: 'bg-green-100 text-green-700 border-green-200',
    selected: 'bg-green-600 text-white border-green-600',
  },
  {
    value: 'other',
    label: 'その他',
    base: 'bg-gray-100 text-gray-700 border-gray-200',
    selected: 'bg-gray-600 text-white border-gray-600',
  },
] as const;

interface UgcFormProps {
  areaNameEn?: string;
  nearbyAreas?: { areaName: string; nameEn: string }[];
  onPosted: () => void;
}

export function UgcForm({ areaNameEn, nearbyAreas, onPosted }: UgcFormProps) {
  const [category, setCategory] = useState<string>('safety');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>(nearbyAreas?.[0]?.nameEn ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const charCount = content.length;
  const charEnough = charCount >= 10;

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
      area_name_en: areaNameEn ?? selectedArea,
    };

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
    setSelectedArea(nearbyAreas?.[0]?.nameEn ?? '');
    setSuccess(true);
    onPosted();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Privacy note */}
      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <span aria-hidden="true">🔒</span>
        匿名で投稿されます
      </p>

      {/* Area selector (station pages only) */}
      {nearbyAreas && nearbyAreas.length > 0 && (
        <div>
          <label htmlFor="ugc-area" className="block text-sm font-medium text-gray-700 mb-1">どのエリアについて？</label>
          <select
            id="ugc-area"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {nearbyAreas.map((a) => (
              <option key={a.nameEn} value={a.nameEn}>{a.areaName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Category pill buttons */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isSelected = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  isSelected ? c.selected : c.base
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">評価（任意）</label>
        <div className="flex gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(rating === star ? null : star)}
              aria-label={`${star}つ星${rating === star ? '（選択解除）' : ''}`}
              className={`text-2xl transition ${
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

      {/* Content textarea with character counter */}
      <div>
        <label htmlFor="ugc-content" className="block text-sm font-medium text-gray-700 mb-1">口コミ</label>
        <textarea
          id="ugc-content"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          rows={4}
          placeholder="例：夜道が暗い、公園が多くて子育てしやすい、駅前が騒がしい…"
        />
        <p className={`mt-1 text-xs ${charEnough ? 'text-green-600' : 'text-gray-400'}`}>
          {charCount}文字 / 10文字以上
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div aria-live="polite" className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
          <span aria-hidden="true">✓</span>
          投稿しました！
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 py-3 text-base font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '投稿中…' : '投稿する'}
      </button>
    </form>
  );
}
