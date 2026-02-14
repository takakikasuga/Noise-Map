---
title: SVG の精度を最適化する
impact: LOW
impactDescription: ファイルサイズを削減
tags: rendering, svg, optimization, svgo
---

## SVG の精度を最適化する

ファイルサイズを削減するために SVG 座標の精度を下げます。最適な精度は viewBox のサイズに依存しますが、一般的に精度の削減を検討すべきです。

**誤り（過剰な精度）：**

```svg
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />
```

**正しい（小数点以下1桁）：**

```svg
<path d="M 10.3 20.8 L 30.9 40.2" />
```

**SVGO で自動化：**

```bash
npx svgo --precision=1 --multipass icon.svg
```
