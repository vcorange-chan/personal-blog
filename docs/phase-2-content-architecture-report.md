# Phase 2：内容架构工作报告

日期：2026-06-05  
工作目录：`C:\Users\1\Documents\Documents\Blogs`  
GitHub 仓库：`https://github.com/vcorange-chan/personal-blog`

## 1. Phase 2 目标

本阶段目标是建立博客的核心内容架构：

- 创建 `src/content/config.ts`。
- 严格实现 `posts` schema。
- 建立 6 个固定一级分类目录。
- 把现有 Rust 文章归入 `tech/rust`。
- 准备两篇验收测试文章：
  - 法语互动笔记：`lang / french / learning-french`
  - Algebra Chapter 0 图片旁注：`math / algebra / algebra-ch0`
- 验证博客同时支持 Markdown、交互 HTML 和图片内容。

本阶段不执行 Umami。

## 2. 本阶段确认并记录的决策

用户已确认：

- Tagline：`A place for mathematics, software, and long-form thinking.`
- 字体组合：标题 Inter，正文 EB Garamond，代码 JetBrains Mono，中文为楷书。
- 配色方向：米黄色背景，`#F5F1E8`，旧书感。
- Logo：先自行设计占位，后续用户上传图片。
- Repo：继续使用 `personal-blog`。
- Repo 可见性：Public。
- Umami：自托管，但本阶段不执行。

本阶段已应用：

- Tagline 已写入首页和站点 description。

本阶段仅记录、暂不完整执行：

- 字体组合。
- 旧书感配色。
- Logo 设计。
- Umami 自托管。

这些属于后续视觉与部署阶段。

## 3. 创建内容配置文件

### 3.1 新增 `src/content/config.ts`

新增文件：

```text
src/content/config.ts
```

内容核心：

```typescript
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(["math", "tech", "projects", "academia", "lang", "read"]),
    subcategory: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    tags: z.array(z.string()).optional(),
    lang: z.enum(["zh", "en", "fr", "ko"]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

说明：

- 字段严格对应 handoff 中的 Phase 2 schema。
- 没有加入额外字段。
- `subcategory`、`series`、`seriesOrder`、`tags`、`description` 都是可选。
- `draft` 默认为 `false`。

### 3.2 保留 Astro 当前入口

Astro 当前读取顶层文件：

```text
src/content.config.ts
```

因此将它改成转发：

```typescript
export { collections } from "./content/config";
```

这样同时满足：

- Astro 能正常读取 content collection。
- 项目里有用户要求的 `src/content/config.ts`。

## 4. 从 `post` collection 切换到 `posts`

Phase 1 为了保持 Cactus 可运行，暂时沿用了 Cactus 的 `post` collection。

Phase 2 已将源码改为 `posts`：

- `src/data/post.ts`
- `src/utils/date.ts`
- `src/components/blog/PostPreview.astro`
- `src/components/blog/Masthead.astro`
- `src/layouts/BlogPost.astro`
- `src/pages/index.astro`
- `src/pages/posts/[...page].astro`
- `src/pages/tags/[tag]/[...page].astro`

同时移除了 Cactus 残留的 `pinned` 逻辑，因为 Phase 2 schema 不包含 `pinned` 字段。

## 5. 建立六个固定一级分类目录

创建目录：

```text
src/content/posts/math/
src/content/posts/tech/
src/content/posts/projects/
src/content/posts/academia/
src/content/posts/lang/
src/content/posts/read/
```

其中暂时没有文章的目录加入 `.gitkeep`：

```text
src/content/posts/academia/.gitkeep
src/content/posts/projects/.gitkeep
src/content/posts/read/.gitkeep
```

原因：

- Git 不跟踪空目录。
- `.gitkeep` 可以让这些分类目录同步到 GitHub。

## 6. Rust 文章迁移

旧路径：

```text
src/content/post/tech/rust/variables.md
```

新路径：

```text
src/content/posts/tech/rust/variables.md
```

分类：

```yaml
category: tech
subcategory: rust
series: rust-learning
seriesOrder: 1
lang: zh
```

当前访问路径：

```text
/posts/tech/rust/variables/
```

## 7. 法语互动笔记

用户提供文件：

```text
src/content/post/Lecon1-Interactive.html
```

### 7.1 支持策略

博客支持两种内容形态：

- Markdown 普通文章。
- HTML 交互内容。

为了让交互 HTML 同时拥有博客 metadata、分类、series、tags，我采用：

```text
Markdown wrapper + iframe HTML asset
```

也就是：

- 博客文章文件：

```text
src/content/posts/lang/french/lecon-1-interactive.md
```

- 交互 HTML 文件：

```text
public/interactive/lecon-1.html
```

文章里嵌入：

```html
<iframe src="/interactive/lecon-1.html"></iframe>
```

### 7.2 为什么不用原 HTML 直接进 collection

原文件是完整 HTML 文档：

```html
<!DOCTYPE html>
<html>
<head>
<body>
```

如果直接塞进 Markdown 正文，会和 Astro 的 layout 冲突。

同时原 HTML 自带全局 CSS，例如 `body`、`*` 等选择器。如果直接嵌入正文，可能污染整个博客页面样式。

iframe 可以隔离样式和脚本，同时保留交互。

### 7.3 API key 安全处理

原 HTML 中包含 ElevenLabs API key。

因为 repo 是 Public，不能把 API key 放进前端代码提交到 GitHub。

处理方式：

- 没有提交原始 HTML。
- 生成安全版 `public/interactive/lecon-1.html`。
- 移除 ElevenLabs 客户端 API 调用。
- 改为浏览器 Web Speech API 播放法语。

安全检查：

```powershell
rg 'sk_|ELEVEN_KEY|xi-api-key|elevenlabs' public src
```

结果：

- 没有匹配。
- 公开代码里没有 ElevenLabs key。

### 7.4 法语文章 frontmatter

```yaml
title: "Leçon 1: Dire la nationalité et les langues parlées"
date: 2026-06-02
category: lang
subcategory: french
series: learning-french
seriesOrder: 1
tags:
  - french
  - language-learning
  - interactive
lang: zh
description: "一份交互式法语学习笔记，主题是国籍、语言和课堂语言画像。"
draft: false
```

当前访问路径：

```text
/posts/lang/french/lecon-1-interactive/
```

HTML iframe 路径：

```text
/interactive/lecon-1.html
```

## 8. Algebra Chapter 0 图片旁注

用户提供图片：

```text
src/content/post/P16.jpg
src/content/post/P17.jpg
```

### 8.1 图片存放

最初尝试把图片放在 content 目录中，用文章里的相对路径引用。

问题：

```html
<img src="./P16.jpg">
```

在浏览器中会被解析成：

```text
/posts/math/algebra/P16.jpg
```

这个路径不存在。

解决方式：

把图片移到 public 目录：

```text
public/images/algebra/P16.jpg
public/images/algebra/P17.jpg
```

文章中使用绝对路径：

```html
<img src="/images/algebra/P16.jpg" />
<img src="/images/algebra/P17.jpg" />
```

这样静态部署时路径稳定。

### 8.2 Algebra 文章路径

```text
src/content/posts/math/algebra/algebra-chapter-0-p16-p17.md
```

frontmatter：

```yaml
title: "Algebra Chapter 0 旁注：P16-P17"
date: 2026-06-02
category: math
subcategory: algebra
series: algebra-ch0
seriesOrder: 1
tags:
  - algebra
  - algebra-chapter-0
  - notes
lang: zh
description: "Algebra Chapter 0 的图片旁注测试文章，用于验证博客对图片内容的支持。"
draft: false
```

当前访问路径：

```text
/posts/math/algebra/algebra-chapter-0-p16-p17/
```

图片路径：

```text
/images/algebra/P16.jpg
/images/algebra/P17.jpg
```

## 9. 构建验证

执行：

```powershell
npm run build
```

结果：

```text
16 page(s) built
build Complete
```

生成的关键页面：

```text
/posts/lang/french/lecon-1-interactive/
/posts/math/algebra/algebra-chapter-0-p16-p17/
/posts/tech/rust/variables/
/rss.xml
/tags/french/
/tags/algebra/
/tags/rust/
```

仍有非致命提示：

```text
The icon(public/icon.svg) provided is not square.
```

说明：

- Logo 后续会替换，因此本阶段不处理。

## 10. 本地访问验证

启动：

```powershell
npm run dev -- --host 127.0.0.1
```

地址：

```text
http://127.0.0.1:4321/
```

检查结果：

```text
首页                                  200 OK
/posts/tech/rust/variables/           200 OK
/posts/lang/french/lecon-1-interactive/ 200 OK
/posts/math/algebra/algebra-chapter-0-p16-p17/ 200 OK
/interactive/lecon-1.html             200 OK
/rss.xml                              200 OK
/images/algebra/P16.jpg               200 OK
/images/algebra/P17.jpg               200 OK
```

并确认：

- 法语文章 HTML 中包含 `/interactive/lecon-1.html`。
- Algebra 文章 HTML 中包含 `/images/algebra/P16.jpg`。

## 11. 当前完成结果

Phase 2 已完成：

- 已创建 `src/content/config.ts`。
- 已严格实现 `posts` schema。
- 已建立 6 个固定一级分类目录。
- Rust 文章已归入 `tech/rust`。
- 法语互动笔记已归入 `lang/french/learning-french`。
- Algebra 图片旁注已归入 `math/algebra/algebra-ch0`。
- 博客支持 Markdown 普通文章。
- 博客支持 iframe 承载的交互 HTML 文章。
- 博客支持图片内容。
- 已避免把 ElevenLabs API key 提交到 Public repo。
- 构建成功。
- 本地访问验证通过。

## 12. 后续建议

下一阶段可以进入：

1. 分类页和子分类页。
   - `/math/`
   - `/tech/`
   - `/lang/french/`

2. 系列页。
   - `/series/`
   - `/series/learning-french/`
   - `/series/algebra-ch0/`

3. 视觉阶段。
   - Inter / EB Garamond / JetBrains Mono / 楷书。
   - 米黄色旧书背景 `#F5F1E8`。
   - Logo 占位设计。

4. 后续再做 Umami 自托管。

