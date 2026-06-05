# Phase 6 数学、代码与正文体验报告

日期：2026-06-06

## 目标

Phase 6 的目标是确认并升级博客的数学公式、代码高亮和正文阅读体验。

清单：

- [x] 配置 KaTeX。
- [x] 测试行内公式 `$E=mc^2$`。
- [x] 测试块级公式 `$$...$$`。
- [x] 检查暗色模式下 KaTeX 颜色。
- [x] 确认 Shiki 代码高亮正常。
- [x] 优化中文字体 fallback。
- [x] 为长文正文设置 serif 字体。

## 检查结论

Phase 6 之前，项目已经有数学和代码的基础能力：

- `astro.config.ts` 已配置 `remark-math`。
- `astro.config.ts` 已配置 `rehype-katex`。
- 项目使用 `astro-expressive-code`，底层使用 Shiki 风格的代码高亮。

但存在两个缺口：

- 没有显式导入 KaTeX CSS，公式 HTML 能生成，但样式不够完整。
- 全局视觉仍偏 Astro Cactus 默认灰白，没有恢复最初约定的米黄色旧书感。

本轮已经补齐。

## 实际改动

### 1. 导入 KaTeX CSS

文件：

- `src/styles/global.css`

新增：

```css
@import "katex/dist/katex.min.css";
```

原因：

`remark-math` 和 `rehype-katex` 负责把 Markdown 数学语法转换成 KaTeX HTML，但 KaTeX 的视觉样式需要额外 CSS。导入后，行内公式和块级公式都会按 KaTeX 样式渲染。

### 2. 恢复旧书感配色

文件：

- `src/styles/global.css`

浅色模式核心颜色：

```css
--color-global-bg: #f5f1e8;
--color-global-text: #2f2922;
--color-muted: #6f6254;
--color-link: #276b60;
--color-accent: #9a3f2f;
--color-accent-2: #211b16;
--color-quote: #7b4a2f;
```

说明：

- 背景恢复为最初约定的 `#F5F1E8`。
- 文字改成偏墨色的暖黑。
- 链接使用克制的绿。
- 强调色使用旧书批注感的红棕。
- 背景增加非常轻的纸张横纹/竖纹，不使用装饰性光斑。

### 3. 暗色模式下的数学颜色

文件：

- `src/styles/global.css`

新增：

```css
.katex {
  color: var(--color-global-text);
}

.katex-display {
  overflow-x: auto;
}
```

说明：

- KaTeX 颜色跟随全站文字颜色。
- 暗色模式下不会出现公式颜色过淡或过暗的问题。
- 长块级公式允许横向滚动，避免移动端挤出页面。

### 4. 字体策略升级

文件：

- `src/styles/global.css`
- `src/layouts/Base.astro`
- `src/site.config.ts`

字体栈：

```css
--font-ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

--font-serif: "EB Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", "Kaiti SC", KaiTi, STKaiti, serif;

--font-code: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

改动：

- 移除 `Base.astro` 上强制全站 `font-mono` 的 class。
- UI 使用 Inter 优先的 sans-serif。
- 长文正文 `.prose` 使用 serif 字体栈。
- 中文 fallback 加入 `Kaiti SC`、`KaiTi`、`STKaiti`。
- 代码字体优先 `JetBrains Mono`。
- Expressive Code 的 `codeFontFamily` 也改为 JetBrains Mono 优先。

注意：

当前没有把字体文件打包进仓库，也没有引入外部 Google Fonts。浏览器如果本机没有 `EB Garamond` 或 `JetBrains Mono`，会自动使用后续 fallback。

### 5. 新增 Phase 6 验收文章

文件：

- `src/content/posts/math/algebra/math-code-typesetting-test.md`

新增内容用于测试：

- 行内公式：`$E=mc^2$`
- 块级公式：

```tex
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
```

- 代数公式：

```tex
\ker f = \{x \in G \mid f(x)=e_H\}, \qquad G / \ker f \cong \operatorname{im} f
```

- Rust 代码块
- TypeScript 代码块
- 中文长文段落

生成页面：

```text
/posts/math/algebra/math-code-typesetting-test/
```

## 使用过的命令

```powershell
Get-Content astro.config.ts
Get-Content src\styles\global.css
Get-Content tailwind.config.ts
```

用途：检查 KaTeX、代码高亮、Typography 和全局样式配置。

```powershell
Test-Path node_modules\katex\dist\katex.min.css
```

用途：确认本地依赖中存在 KaTeX CSS。

```powershell
rg -n "font-mono|prose|katex|expressive-code|font-family" src tailwind.config.ts astro.config.ts
```

用途：定位字体、正文、公式和代码高亮相关配置。

```powershell
npm run build
```

用途：验证 Astro 静态构建。

```powershell
npm run check
```

用途：验证 `astro check && biome check`。

```powershell
Select-String -Path dist\posts\math\algebra\math-code-typesetting-test\index.html -Pattern "katex|expressive-code|E=mc|sqrt|language-rust"
```

用途：确认构建产物中实际出现 KaTeX HTML 和 Expressive Code 代码高亮结构。

```powershell
Select-String -Path dist\_astro\*.css -Pattern "#f5f1e8|katex|EB Garamond|JetBrains Mono|Kaiti"
```

用途：确认旧书背景色、KaTeX 样式和字体栈进入最终 CSS。

## 验证结果

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 34 个页面。
- 新增测试文章页面已生成。
- 新增 tags 页面：
  - `/tags/math/`
  - `/tags/katex/`
  - `/tags/code/`

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议未来换成正方形 icon。

这不影响 Phase 6。

### 完整检查

执行：

```powershell
npm run check
```

结果：

- `astro check`：0 errors / 0 warnings / 0 hints。
- `biome check`：通过。

### 构建产物检查

确认结果：

- 行内公式 `$E=mc^2$` 已生成 `<span class="katex">...`。
- 块级公式已生成 `<span class="katex-display">...`。
- Rust/TypeScript 代码块已生成 `<div class="expressive-code">...`。
- 最终 CSS 中包含：
  - `#f5f1e8`
  - `EB Garamond`
  - `JetBrains Mono`
  - `Kaiti SC`
  - `KaiTi`

## Phase 6 状态

- [x] 配置 KaTeX。
- [x] 测试行内公式 `$E=mc^2$`。
- [x] 测试块级公式 `$$...$$`。
- [x] 检查暗色模式下 KaTeX 颜色。
- [x] 确认 Shiki/Expressive Code 代码高亮正常。
- [x] 优化中文字体 fallback。
- [x] 为长文正文设置 serif 字体。
- [x] 恢复米黄色旧书感背景 `#F5F1E8`。

## 后续建议

- 如果你希望 `EB Garamond`、`Inter`、`JetBrains Mono` 在所有设备上都完全一致，可以把字体文件下载到 `public/fonts/` 并用 `@font-face` 本地加载。
- 如果你希望中文“楷书感”更稳定，也可以后续加入可再分发的中文字体文件；当前主要依赖系统自带字体。
