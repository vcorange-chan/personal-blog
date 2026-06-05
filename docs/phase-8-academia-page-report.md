# Phase 8 Academia 专属页报告

日期：2026-06-06

## 目标

Phase 8 的目标是把 `/academia/` 从普通分类页升级成学术专属页面。

清单：

- [x] 创建 `src/data/publications.yaml`。
- [x] 创建 `/academia/` 专属页面。
- [x] 实现 Publications 区块。
- [x] 实现 In Progress 区块。
- [x] 实现 Writing 区块。
- [x] 自动列出 `category=academia` 且 `subcategory=reviews` 的 Reading Notes。

## 实际改动

### 1. 新增 YAML 数据源

文件：

- `src/data/publications.yaml`

结构：

```yaml
publications: []

inProgress:
  - title: "Algebra Chapter 0 reading notes"
    status: "Reading notes"
    description: "Structured notes and side comments while reading Algebra Chapter 0."
    year: 2026
    links:
      - label: "Series"
        url: "/series/algebra-ch0/"

writing:
  - title: "Mathematics, software, and long-form thinking"
    status: "Essay draft"
    description: "A working thread for turning study notes into publishable long-form essays."
    year: 2026
    links:
      - label: "Posts"
        url: "/posts/"
```

说明：

- `publications` 目前为空数组，页面会显示空状态。
- `inProgress` 和 `writing` 放了可编辑的初始条目。
- 后续只需要编辑这个 YAML 文件，就能更新 Academia 页面。

### 2. 新增 YAML 读取器

文件：

- `src/data/publications.ts`

作用：

- 读取 `src/data/publications.yaml`。
- 解析成统一的 `AcademicWork` 数据结构。
- 对字段做轻量规范化，避免 YAML 中缺字段导致页面报错。

实现方式：

```ts
import publicationsSource from "./publications.yaml?raw";
import { parse } from "yaml";
```

说明：

使用 `?raw` 是为了让 Vite/Astro 在构建期把 YAML 内容内联进 bundle，避免静态构建后找不到源文件。

### 3. 新增 AcademicList 组件

文件：

- `src/components/academia/AcademicList.astro`

作用：

- 渲染 Publications / In Progress / Writing 三类 YAML 数据。
- 支持：
  - title
  - year
  - authors
  - status
  - venue
  - description
  - links
- 支持空状态文案。

### 4. 升级 Academia 页面

文件：

- `src/pages/academia/index.astro`

新增区块：

- `Publications`
- `In Progress`
- `Writing`
- `Reading Notes`
- `Subcategories`

Reading Notes 的筛选逻辑：

```ts
const readingNotes = allPosts
  .filter((post) => post.data.category === "academia" && post.data.subcategory === "reviews")
  .sort(collectionDateSort);
```

这意味着以后只要文章 frontmatter 写：

```yaml
category: academia
subcategory: reviews
```

它就会自动出现在 `/academia/` 的 Reading Notes 区块。

### 5. 新增 Reading Notes 验收文章

文件：

- `src/content/posts/academia/reviews/reading-note-template.md`

作用：

- 验证 `category=academia` + `subcategory=reviews` 的文章会自动进入 Academia 页面。
- 构建后生成：

```text
/posts/academia/reviews/reading-note-template/
/academia/reviews/
```

## 使用过的命令

```powershell
Get-Content src\pages\academia\index.astro
Get-Content package.json
Get-ChildItem src\data -File
rg -n "yaml|js-yaml|publications|academia|reviews" src package.json astro.config.ts
```

用途：检查现有 Academia 页面、依赖、数据目录和相关关键词。

```powershell
Test-Path node_modules\yaml
Test-Path node_modules\js-yaml
Select-String -Path package-lock.json -Pattern '"yaml"|"js-yaml"'
```

用途：确认本地已有 YAML 解析能力，不需要新增安装依赖。

```powershell
npm run build
```

用途：验证静态构建和 `/academia/` 页面生成。

```powershell
npm run check
```

用途：验证 `astro check && biome check`。

```powershell
npx biome check --write src\pages\academia\index.astro
```

用途：修复 Biome import 排序要求。

```powershell
Select-String -Path dist\academia\index.html -Pattern "Publications|In Progress|Writing|Reading Notes|Reading Note: Algebra Chapter 0"
```

用途：确认构建产物里实际包含 Phase 8 的四个核心区块和自动列出的 Reading Note。

## 遇到的问题与解决

### 问题 1：构建后找不到 `publications.yaml`

第一次实现时使用了 `fs.readFile` 和 `import.meta.url` 查找 YAML 文件。

构建时报错：

```text
ENOENT: no such file or directory, open 'dist/.prerender/chunks/publications.yaml'
```

原因：

Astro 静态构建后，模块会被打包到 `dist/.prerender/chunks/`，运行时相对路径不再指向 `src/data/publications.yaml`。

解决：

改为：

```ts
import publicationsSource from "./publications.yaml?raw";
```

这样 YAML 内容在构建期被 Vite 内联，不依赖运行时文件路径。

### 问题 2：TypeScript strict optional 类型报错

`exactOptionalPropertyTypes` 下，显式写入 `undefined` 到 optional 字段会报错。

解决：

只在字段真实存在时写入对象，例如：

```ts
if (authors.length) normalized.authors = authors;
if (typeof item.description === "string") normalized.description = item.description;
```

### 问题 3：Biome import 顺序

`npm run check` 提示 `src/pages/academia/index.astro` import 顺序需要整理。

解决：

执行：

```powershell
npx biome check --write src\pages\academia\index.astro
```

## 验证结果

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 40 个页面。
- `/academia/` 已生成。
- `/academia/reviews/` 已生成。
- `/posts/academia/reviews/reading-note-template/` 已生成。

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议未来换成正方形 icon。

这不影响 Phase 8。

### 完整检查

执行：

```powershell
npm run check
```

结果：

- `astro check`：0 errors / 0 warnings / 0 hints。
- `biome check`：通过。

### 构建产物检查

`dist/academia/index.html` 已包含：

- `Publications`
- `In Progress`
- `Writing`
- `Reading Notes`
- `Reading Note: Algebra Chapter 0`
- `Algebra Chapter 0 reading notes`

## Phase 8 状态

- [x] 创建 `src/data/publications.yaml`。
- [x] 创建 `/academia/` 专属页面。
- [x] 实现 Publications 区块。
- [x] 实现 In Progress 区块。
- [x] 实现 Writing 区块。
- [x] 自动列出 `category=academia` 且 `subcategory=reviews` 的 Reading Notes。

## 后续建议

- 如果未来 publications 条目变多，可以为 `publications.yaml` 增加 `type` 字段，例如 `paper`、`talk`、`preprint`。
- 如果有正式论文 DOI，可以在 links 中加入 `DOI` 和 `PDF`。
- 如果不希望验收文章长期出现在公开博客，可以之后把 `reading-note-template.md` 改成 `draft: true`，但这样线上构建时 Reading Notes 区块会变为空。
