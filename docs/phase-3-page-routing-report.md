# Phase 3 页面路由工作报告

日期：2026-06-05

## 目标

Phase 3 的目标是检查并补齐博客的信息架构页面，让文章可以按首页、分类、子分类、文章、系列、标签、学术专题等入口访问。

## 检查结果

执行检查后，发现项目已有这些路由：

- `src/pages/index.astro`：首页，已存在。
- `src/pages/posts/[...page].astro`：文章列表页，已存在。
- `src/pages/posts/[...slug].astro`：文章详情页，已存在。
- `src/pages/tags/index.astro`：标签总览页，已存在。
- `src/pages/tags/[tag]/[...page].astro`：单个标签页，已存在。

缺少这些 Phase 3 路由：

- `/[category]/`
- `/[category]/[subcategory]/`
- `/series/`
- `/series/[series]/`
- `/academia/`

## 实际改动

### 1. 新增文章聚合工具

文件：`src/data/post.ts`

新增函数：

- `getCategoryCounts(posts)`：统计每个一级分类的文章数量。
- `getSubcategoryCounts(posts, category)`：统计某个一级分类下的子分类数量。
- `getSeriesCounts(posts)`：统计所有系列及文章数量。
- `slugifyValue(value)`：把系列名称转换为 URL slug，例如 `Algebra Ch0` 转成 `algebra-ch0`。
- `sortSeriesPosts(posts)`：系列内文章优先按 `seriesOrder` 排序，再按日期排序。

这样做的原因：

- 分类页、子分类页、系列页都需要读取同一批 posts metadata。
- 把统计逻辑集中到 `src/data/post.ts`，以后新增页面时不用重复写筛选逻辑。

### 2. 新增分类页

文件：`src/pages/[category]/index.astro`

生成路由：

- `/lang/`
- `/math/`
- `/projects/`
- `/read/`
- `/tech/`

说明：

- 页面会列出该分类下的文章。
- 页面会展示该分类下已有的子分类入口。
- `/academia/` 没有放在这个动态路由中，因为它有单独的学术专属页，避免和静态路由冲突。

### 3. 新增子分类页

文件：`src/pages/[category]/[subcategory]/index.astro`

当前构建生成的例子：

- `/lang/french/`
- `/math/algebra/`
- `/tech/rust/`

说明：

- 页面根据现有文章的 `category` 和 `subcategory` 自动生成。
- 以后只要文章 frontmatter 里写了新的 `subcategory`，构建时会自动出现对应页面。

### 4. 新增系列总览页

文件：`src/pages/series/index.astro`

生成路由：

- `/series/`

说明：

- 汇总所有设置了 `series` 字段的文章系列。
- 每个系列显示文章数量，并链接到单个系列页。

### 5. 新增单个系列页

文件：`src/pages/series/[series]/index.astro`

当前构建生成的例子：

- `/series/algebra-ch0/`
- `/series/learning-french/`
- `/series/rust-learning/`

说明：

- 路由 slug 由 `series` 字段自动转换。
- 系列内文章按 `seriesOrder` 排序；没有 `seriesOrder` 时按日期排序。

### 6. 新增学术专属页

文件：`src/pages/academia/index.astro`

生成路由：

- `/academia/`

说明：

- 这是单独的学术入口，不依赖动态分类页。
- 当前没有 academia 文章时，会显示空状态。
- 以后学术文章只要设置 `category: academia`，会自动出现在这里。

## 使用过的命令

```powershell
Get-ChildItem -Recurse -File src\pages | Select-Object FullName
```

用途：检查当前已有页面路由文件。

```powershell
Get-ChildItem -Recurse -File src | Where-Object { $_.FullName -match '(utils|lib|content|layouts|components)' } | Select-Object FullName
```

用途：查看内容结构、布局、组件和工具函数，确认应该沿用哪些主题组件。

```powershell
Get-Content -LiteralPath 'src\pages\posts\[...page].astro'
Get-Content -LiteralPath 'src\pages\tags\[tag]\[...page].astro'
Get-Content src\data\post.ts
Get-Content src\content\config.ts
```

用途：阅读已有文章列表页、标签页、文章数据工具和 content schema。

```powershell
npm run build
```

用途：验证新增路由能否被 Astro 静态构建成功生成。

```powershell
git diff -- src\data\post.ts src\pages
git status --short
```

用途：复查本次改动范围，确认没有改到无关文件。

## 遇到的问题与解决办法

### 问题：第一次构建时报 `routeCategories is not defined`

原因：

Astro 在处理动态路由的 `getStaticPaths` 时，会把该函数放入构建流程中执行。某些外层派生变量在打包后的静态路径生成阶段不能可靠访问。

解决：

把 `routeCategories` 直接放进 `getStaticPaths` 函数内部：

```ts
const routeCategories = ["lang", "math", "projects", "read", "tech"];
```

修复后再次执行 `npm run build`，构建通过。

## 构建验证

最终执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 29 个页面。
- Phase 3 新增路由已生成，包括：
  - `/academia/`
  - `/series/`
  - `/series/algebra-ch0/`
  - `/series/learning-french/`
  - `/series/rust-learning/`
  - `/lang/`
  - `/lang/french/`
  - `/math/`
  - `/math/algebra/`
  - `/tech/`
  - `/tech/rust/`
  - `/projects/`
  - `/read/`

构建时仍有一个既有提示：

- `public/icon.svg` 不是正方形，因此 webmanifest 插件建议以后换成正方形 icon。

这个提示不是 Phase 3 新增问题，不影响页面路由功能。

## Phase 3 清单状态

- [x] 首页 `src/pages/index.astro`
- [x] 分类页 `/[category]/`
- [x] 子分类页 `/[category]/[subcategory]/`
- [x] 文章页 `/posts/[...slug]/`
- [x] 系列总览 `/series/`
- [x] 单个系列页 `/series/[series]/`
- [x] 标签总览 `/tags/`
- [x] 单个标签页 `/tags/[tag]/`
- [x] 学术专属页 `/academia/`

## 后续建议

- 如果你希望顶部导航直接出现 `Math / Tech / Lang / Series / Academia`，下一步可以调整 `src/site.config.ts` 或 Header 相关配置。
- 如果未来系列名称包含中文，需要把 `slugifyValue` 扩展成更完整的 slug 规则，或者在 schema 中增加单独的 `seriesSlug` 字段。
