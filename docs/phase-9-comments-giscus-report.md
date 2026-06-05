# Phase 9 评论系统报告

日期：2026-06-06

## 目标

Phase 9 的目标是为文章页接入评论系统，优先使用 giscus。

清单：

- [x] 在 GitHub repo 开启 Discussions。
- [x] 安装 giscus GitHub App。
- [x] 从 giscus.app 获取配置 ID。
- [x] 在文章页 layout 中加入 giscus。
- [x] 本地或部署后验证评论区显示。
- [x] 如果 giscus 配置困难，再考虑 utterances。

## 当前状态

Phase 9 已完成并在线上验证。

已完成：

- GitHub repo 已开启 Discussions。
- giscus GitHub App 已安装并授权到 `vcorange-chan/personal-blog`。
- giscus 配置 ID 已从 giscus.app 获取并回填。
- 普通文章页底部已显示 `Comments` 区块和 giscus 评论框。
- 用户已在线上确认评论区可见。

说明：

- `layout: immersive` 的完整互动文章仍不显示评论区，避免破坏沉浸式页面体验。
- 普通 Markdown/MDX 文章显示评论区。

## 实际改动

### 1. 新增 giscus 配置结构

文件：

- `src/types.ts`
- `src/site.config.ts`

新增配置：

```ts
comments: {
  giscus: {
    category: "Announcements",
    categoryId: "DIC_kwDOJzYVeM4CYlzC",
    enabled: true,
    repo: "vcorange-chan/personal-blog",
    repoId: "1259471368",
  },
},
```

说明：

- `enabled: true` 表示评论系统已启用。
- giscus 使用 GitHub Discussions，不需要在仓库中保存任何 token 或密钥。
- 当前 category 使用 `Announcements`。

### 2. 新增 giscus 组件

文件：

- `src/components/blog/GiscusComments.astro`

行为：

- 只有 giscus 配置完整时才渲染。
- 使用 pathname 映射文章讨论：

```html
data-mapping="pathname"
```

- 使用懒加载：

```html
data-loading="lazy"
```

- 使用跟随系统的主题：

```html
data-theme="preferred_color_scheme"
```

### 3. 文章页接入评论区

文件：

- `src/layouts/BlogPost.astro`

改动：

- 导入 `GiscusComments`。
- 在普通文章正文后显示评论区。
- `layout: immersive` 的文章暂时不显示评论区，避免完整互动 HTML 页面底部被评论区打断。

## 已完成的 GitHub 侧步骤

### 1. 开启 GitHub Discussions

进入：

```text
https://github.com/vcorange-chan/personal-blog
```

状态：

已完成。

### 2. 安装 giscus GitHub App

进入：

```text
https://github.com/apps/giscus
```

状态：

已完成。

### 3. 从 giscus.app 获取配置

进入：

```text
https://giscus.app/
```

实际配置：

```text
Repository: vcorange-chan/personal-blog
Page ↔ Discussions Mapping: pathname
Discussion Category: Announcements
Features: reactions enabled
Theme: preferred_color_scheme
Repository ID: 1259471368
Category ID: DIC_kwDOJzYVeM4CYlzC
```

### 4. 回填配置

打开：

```text
src/site.config.ts
```

已回填为：

```ts
comments: {
  giscus: {
    category: "Announcements",
    categoryId: "DIC_kwDOJzYVeM4CYlzC",
    enabled: true,
    repo: "vcorange-chan/personal-blog",
    repoId: "1259471368",
  },
},
```

不要把 GitHub token 或任何密钥放进这里。giscus 不需要密钥。

## 验证方式与结果

已执行：

```powershell
npm run build
npm run check
```

结果：

- `npm run build` 通过。
- `npm run check` 通过。
- 构建产物中普通文章页包含 `https://giscus.app/client.js`。
- 用户已在线上看到评论区。

本地运行：

```powershell
npm run dev
```

打开任意普通文章，例如：

```text
http://127.0.0.1:4321/posts/math/algebra/math-code-typesetting-test/
```

如果配置正确，文章底部会出现 `Comments` 区块和 giscus 评论框。

部署后可检查：

```text
https://blog.cliffordchen.org/posts/math/algebra/math-code-typesetting-test/
```

## Phase 9 状态

- [x] 让你在 GitHub repo 开启 Discussions。
- [x] 安装 giscus GitHub App。
- [x] 从 giscus.app 获取配置 ID。
- [x] 在文章页 layout 中加入 giscus。
- [x] 本地或部署后验证评论区显示。
- [x] 如果 giscus 配置困难，再考虑 utterances。

## 备用方案

如果 giscus 配置困难，可以考虑 utterances。

但当前建议继续优先 giscus，原因：

- 使用 GitHub Discussions，比 issue 评论更适合博客讨论。
- 支持 reactions。
- 不需要自己维护评论后端。
