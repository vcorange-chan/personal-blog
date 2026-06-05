---
title: "数学与代码排版测试"
date: 2026-06-06
category: math
subcategory: algebra
series: algebra-ch0
seriesOrder: 2
tags:
  - math
  - katex
  - code
lang: zh
description: "用于验收 KaTeX、块级公式、代码高亮、中文正文和旧书风格的测试文章。"
draft: false
---

这篇文章用于检查 Phase 6 的正文体验：中文长文应该更接近纸质书页，数学公式应该清晰，代码块应该有稳定的高亮。

行内公式测试：爱因斯坦质能方程写作 $E=mc^2$。另一个行内例子是群同态 $\varphi: G \to H$。

块级公式测试：

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

再测试一个代数风格的块级公式：

$$
\ker f = \{x \in G \mid f(x)=e_H\}, \qquad G / \ker f \cong \operatorname{im} f
$$

Rust 代码高亮测试：

```rust
fn main() {
    let energy = mass_energy(2.0, 299_792_458.0);
    println!("E = {energy}");
}

fn mass_energy(mass: f64, c: f64) -> f64 {
    mass * c.powi(2)
}
```

TypeScript 代码高亮测试：

```ts
type Language = "zh" | "en" | "fr" | "ko";

function label(lang: Language) {
  const names = {
    zh: "中文",
    en: "English",
    fr: "Français",
    ko: "한국어",
  } satisfies Record<Language, string>;

  return names[lang];
}
```

中文长文测试：如果这一段阅读起来像一页温和的旧书，而不是一块冷白色的终端屏幕，那么 Phase 6 的方向就是对的。数学博客需要同时容纳证明、旁注、程序片段和长段解释，因此正文不能过窄、不能太硬，也不能让代码和公式在暗色模式下失去对比度。
