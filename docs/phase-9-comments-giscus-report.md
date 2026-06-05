# Phase 9 评论系统报告

日期：2026-06-06

## 目标

Phase 9 的目标是为文章页接入评论系统，优先使用 giscus。

清单：

- [ ] 在 GitHub repo 开启 Discussions。
- [ ] 安装 giscus GitHub App。
- [ ] 从 giscus.app 获取配置 ID。
- [x] 在文章页 layout 中加入 giscus。
- [ ] 本地或部署后验证评论区显示。
- [ ] 如果 giscus 配置困难，再考虑 utterances。

## 当前状态

代码层已经完成，GitHub 侧配置还需要你手动完成。

原因：

- Discussions 开关在 GitHub 仓库设置里。
- giscus GitHub App 需要仓库 owner 授权。
- `repoId` 和 `categoryId` 需要从 giscus.app 根据仓库实时生成。

在这三个值没有填入前，评论组件默认不会显示，避免线上页面加载一个配置不完整的 giscus。

## 实际改动

### 1. 新增 giscus 配置结构

文件：

- `src/types.ts`
- `src/site.config.ts`

新增配置：

```ts
comments: {
  giscus: {
    enabled: false,
    repo: "vcorange-chan/personal-blog",
    repoId: "",
    category: "General",
    categoryId: "",
  },
},
```

说明：

- `enabled: false` 是安全默认值。
- 当 GitHub 和 giscus 配置完成后，把 `enabled` 改成 `true`，并填入 `repoId`、`categoryId`。

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

## 你需要手动完成的步骤

### 1. 开启 GitHub Discussions

进入：

```text
https://github.com/vcorange-chan/personal-blog
```

操作：

1. 打开 `Settings`。
2. 找到 `Features`。
3. 勾选 `Discussions`。
4. 保存。

建议创建或保留一个 discussion category，例如：

```text
General
```

### 2. 安装 giscus GitHub App

进入：

```text
https://github.com/apps/giscus
```

操作：

1. 点击 `Install`。
2. 选择你的 GitHub 账号或组织。
3. 选择 `Only select repositories`。
4. 选择：

```text
vcorange-chan/personal-blog
```

5. 点击安装/授权。

### 3. 从 giscus.app 获取配置

进入：

```text
https://giscus.app/
```

填写：

```text
Repository: vcorange-chan/personal-blog
Page ↔ Discussions Mapping: pathname
Discussion Category: General
Features: reactions enabled
Theme: preferred_color_scheme
```

然后复制页面生成的配置中的：

```text
data-repo-id
data-category
data-category-id
```

### 4. 回填配置

打开：

```text
src/site.config.ts
```

把：

```ts
comments: {
  giscus: {
    category: "General",
    categoryId: "",
    enabled: false,
    repo: "vcorange-chan/personal-blog",
    repoId: "",
  },
},
```

改成类似：

```ts
comments: {
  giscus: {
    category: "General",
    categoryId: "你的 data-category-id",
    enabled: true,
    repo: "vcorange-chan/personal-blog",
    repoId: "你的 data-repo-id",
  },
},
```

不要把 GitHub token 或任何密钥放进这里。giscus 不需要密钥。

## 验证方式

回填配置后执行：

```powershell
npm run build
npm run check
```

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

- [ ] 让你在 GitHub repo 开启 Discussions。
- [ ] 安装 giscus GitHub App。
- [ ] 从 giscus.app 获取配置 ID。
- [x] 在文章页 layout 中加入 giscus。
- [ ] 本地或部署后验证评论区显示。
- [ ] 如果 giscus 配置困难，再考虑 utterances。

## 备用方案

如果 giscus 配置困难，可以考虑 utterances。

但当前建议继续优先 giscus，原因：

- 使用 GitHub Discussions，比 issue 评论更适合博客讨论。
- 支持 reactions。
- 不需要自己维护评论后端。
