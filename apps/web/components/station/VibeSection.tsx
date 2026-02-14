import type { VibeData } from '@hikkoshinoise/shared';

interface VibeSectionProps {
  data: VibeData;
}

/**
 * 雰囲気セクションコンポーネント
 * 人口構成・施設数・タグを表示
 */
export function VibeSection({ data }: VibeSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">街の雰囲気</h2>
      <div className="flex flex-wrap gap-2">
        {data.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
