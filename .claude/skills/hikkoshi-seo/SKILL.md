---
name: hikkoshi-seo
description: "ヒッコシマップのSEO最適化パターン。駅ページの構造化データ、メタデータ、OGP、内部リンク設計、URL設計の実装時に使用。約800ページのロングテールSEOを最大化するためのガイドライン。"
---

# ヒッコシマップ SEOスキル

約800駅ページのロングテールSEOを最大化するためのガイドライン。

## ターゲットキーワード戦略

### 主要キーワードパターン

各駅ページは以下のキーワードで上位表示を狙う:

| パターン | 例 | 検索意図 |
|---------|-----|---------|
| `{駅名} 治安` | 渋谷 治安 | 犯罪状況を知りたい |
| `{駅名} 住みやすさ` | 吉祥寺 住みやすさ | 総合的な住環境評価 |
| `{駅名} 災害リスク` | 二子玉川 災害リスク | 水害・地震リスク |
| `{駅名} 引越し` | 三鷹 引越し | 引越し先として検討中 |
| `{駅名} 一人暮らし` | 中野 一人暮らし | ターゲット層別 |
| `{駅名} ファミリー` | 武蔵小杉 ファミリー | ターゲット層別 |

多摩地域はSEO競合が少ないため、早期にインデックスされれば優位に立てる。

## URL設計

```
/                          # トップページ
/station/{name_en}         # 駅ページ（例: /station/shibuya）
/compare?stations=shibuya,shinjuku  # 比較ページ
```

- `name_en` はローマ字（ヘボン式）、ハイフン区切り
- 例: 渋谷→shibuya、西新宿→nishi-shinjuku、東京→tokyo
- 駅名が重複する場合: `{駅名}-{路線略称}`（例: shimokitazawa-odakyu）

## メタデータテンプレート

### layout.tsx（共通）

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://hikkoshimap.com'),
  title: {
    template: '%s | ヒッコシマップ',
    default: 'ヒッコシマップ — 東京の住環境リスクマップ',
  },
  description: '東京都約800駅の治安・災害リスク・街の雰囲気を客観データで可視化。引越し前に知りたかった情報を忖度なく提供。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ヒッコシマップ',
  },
};
```

### 駅ページ（動的メタデータ）

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const station = await getStation(params.slug);

  const title = `${station.name}駅の治安・災害リスク・住みやすさ`;
  const description = `${station.name}駅（${station.lines.join('・')}）の治安スコア${station.safetyScore}点、災害リスクスコア${station.hazardScore}点。犯罪件数・洪水リスク・液状化リスクを客観データで評価。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/station/${station.nameEn}`,
    },
    alternates: {
      canonical: `/station/${station.nameEn}`,
    },
  };
}
```

**重要:**
- `description` にスコア数値を含める（クリック率向上）
- `canonical` を必ず設定（重複ページ防止）
- 路線名を含める（「渋谷駅 山手線」等のロングテール対応）

## 構造化データ（JSON-LD）

### 駅ページ

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Place',
  name: `${station.name}駅`,
  geo: {
    '@type': 'GeoCoordinates',
    latitude: station.lat,
    longitude: station.lng,
  },
  review: {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: station.overallScore,
      bestRating: 100,
      worstRating: 0,
    },
    author: {
      '@type': 'Organization',
      name: 'ヒッコシマップ',
    },
    reviewBody: `${station.name}駅の住環境スコア: 治安${station.safetyScore}点、災害${station.hazardScore}点`,
  },
};
```

`<script type="application/ld+json">` で `<head>` に埋め込む。

### パンくずリスト

```typescript
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://hikkoshimap.com' },
    { '@type': 'ListItem', position: 2, name: `${station.municipalityName}`, item: `https://hikkoshimap.com/area/${station.municipalityCode}` },
    { '@type': 'ListItem', position: 3, name: `${station.name}駅`, item: `https://hikkoshimap.com/station/${station.nameEn}` },
  ],
};
```

## 内部リンク設計

### 駅ページ内リンク

各駅ページに以下の内部リンクを設置:

1. **同じ路線の隣駅**: 「← 前の駅 / 次の駅 →」ナビゲーション
2. **同じ区市町村の他の駅**: 「渋谷区の他の駅: 恵比寿、原宿、代官山...」
3. **比較リンク**: 「この駅と比較: よく比較される駅」（将来的にアクセスログから自動生成）
4. **スコアが近い駅**: 「治安スコアが近い駅: ○○駅(82点)、△△駅(79点)」

### サイトマップ

`sitemap.xml` を自動生成:

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stations = await getAllStations();

  const stationPages = stations.map((s) => ({
    url: `https://hikkoshimap.com/station/${s.nameEn}`,
    lastModified: s.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://hikkoshimap.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    ...stationPages,
  ];
}
```

## SSGとSEOの関係

- 駅ページはすべてSSG（ビルド時に静的HTML生成）
- Googlebot はJSレンダリングを待つが、SSGなら不要でインデックス速度が速い
- UGCセクションはCSRだが、SEO的に重要なのはスコアと基本情報（SSGに含まれる）
- `generateStaticParams` で全800駅分のパスを生成

```typescript
export async function generateStaticParams() {
  const stations = await getAllStations();
  return stations.map((s) => ({ slug: s.nameEn }));
}
```

## robots.txt

```
User-agent: *
Allow: /
Sitemap: https://hikkoshimap.com/sitemap.xml

# 比較ページはクエリパラメータが無限に組み合わせ可能なのでnoindex
User-agent: *
Disallow: /compare
```

比較ページはユーザー向け機能だが、SEO的にはインデックスしない（URL組み合わせが膨大になるため）。
