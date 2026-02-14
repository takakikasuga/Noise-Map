---
title: 繰り返しの関数呼び出しをキャッシュする
impact: MEDIUM
impactDescription: 冗長な計算を回避
tags: javascript, cache, memoization, performance
---

## 繰り返しの関数呼び出しをキャッシュする

レンダリング中に同じ入力で同じ関数が繰り返し呼び出される場合、モジュールレベルの Map を使用して関数の結果をキャッシュします。

**誤り（冗長な計算）：**

```typescript
function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // slugify() が同じプロジェクト名に対して100回以上呼び出される
        const slug = slugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**正しい（キャッシュされた結果）：**

```typescript
// モジュールレベルのキャッシュ
const slugifyCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugifyCache.has(text)) {
    return slugifyCache.get(text)!
  }
  const result = slugify(text)
  slugifyCache.set(text, result)
  return result
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // ユニークなプロジェクト名ごとに一度だけ計算される
        const slug = cachedSlugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**単一値関数のよりシンプルなパターン：**

```typescript
let isLoggedInCache: boolean | null = null

function isLoggedIn(): boolean {
  if (isLoggedInCache !== null) {
    return isLoggedInCache
  }

  isLoggedInCache = document.cookie.includes('auth=')
  return isLoggedInCache
}

// 認証が変更された時にキャッシュをクリア
function onAuthChange() {
  isLoggedInCache = null
}
```

Map（フックではなく）を使用することで、ユーティリティ、イベントハンドラなど、React コンポーネントだけでなくあらゆる場所で動作します。

参考：[How we made the Vercel Dashboard twice as fast](https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast)
