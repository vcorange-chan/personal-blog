# Phase 4 首页布局工作报告

日期：2026-06-05

## 目标

Phase 4 的目标是检查并升级首页布局，让首页成为真实可用的博客入口，而不是只显示简单文章列表。

验收清单：

- 顶栏：Logo、导航、语言切换、暗色/亮色切换。
- 简介区：`Clifford Chen` + tagline。
- Recent：显示最近 2-3 篇文章。
- Explore：6 个分类方块 grid，并显示文章数量。
- Series：横向系列卡片列表。

## 检查结果

原有状态：

- `src/pages/index.astro` 已有简介区，但 Recent 显示最近 10 篇文章，没有 Explore 和 Series。
- `src/components/layout/Header.astro` 已有导航和暗色/亮色切换，但 Logo 仍是 Astro Cactus 默认图形，没有语言切换入口。
- `src/site.config.ts` 顶栏导航只有 `Home`、`About`、`Posts`。

## 实际改动

### 1. 首页布局升级

文件：`src/pages/index.astro`

改动：

- 保留简介区：
  - 标题：`Clifford Chen`
  - tagline 来自 `src/site.config.ts` 的 `siteConfig.description`
- Recent 区域改为最近 3 篇文章。
- 新增 Explore 区域：
  - `math`
  - `tech`
  - `projects`
  - `academia`
  - `lang`
  - `read`
- 每个分类方块显示：
  - 分类名称
  - 简短说明
  - 当前文章数量
- 新增 Series 区域：
  - 横向滚动列表
  - 每个系列显示系列名和文章数量

### 2. 顶栏升级

文件：`src/components/layout/Header.astro`

改动：

- 引入 `LanguageSwitch`。
- 将默认 Cactus 图形 Logo 改成文字 Logo：`CC`。
- 顶栏保留：
  - Logo
  - 主导航
  - 语言内容入口
  - 暗色/亮色切换
  - 移动端菜单按钮

### 3. 新增语言内容入口

文件：`src/components/LanguageSwitch.astro`

作用：

- 根据现有文章的 `lang` 字段自动生成语言入口。
- 当前会显示已有内容语言，例如 `中文`。
- 入口链接到 `/languages/[lang]/`。

说明：

这里实现的是“按内容语言筛选”的入口，不是假装整站已经有多语言 UI 翻译。这样更诚实，也更符合当前博客内容结构。

### 4. 新增语言筛选页

文件：`src/pages/languages/[lang]/index.astro`

生成路由示例：

- `/languages/zh/`

作用：

- 按文章 frontmatter 的 `lang` 字段列出文章。
- 以后如果有 `lang: en`、`lang: fr`、`lang: ko` 的文章，对应语言页会自动生成。

### 5. 顶栏导航扩展

文件：`src/site.config.ts`

新增导航入口：

- `Series` -> `/series/`
- `Math` -> `/math/`
- `Tech` -> `/tech/`
- `Lang` -> `/lang/`
- `Academia` -> `/academia/`

保留原入口：

- `Home`
- `About`
- `Posts`

### 6. 数据工具补充

文件：`src/data/post.ts`

新增：

- `getLanguageCounts(posts)`

作用：

- 统计已有文章语言数量。
- 供 `LanguageSwitch` 和 `/languages/[lang]/` 页面使用。

### 7. 顺手修复 Astro 类型问题

文件：

- `src/content/config.ts`
- `src/components/blog/Masthead.astro`
- `src/layouts/BlogPost.astro`

改动：

- 在 posts schema 中补回 `updatedDate: z.date().optional()`。
- `Masthead.astro` 中把 `data.tags` 归一为 `tags = data.tags ?? []`，避免可选 tags 的类型错误。
- `BlogPost.astro` 中当文章没有 `description` 时，用 `title` 作为 meta description fallback。

原因：

这些问题不是首页布局本身造成的，但会让 `astro check` 报错。修复后 Astro/TypeScript 检查干净。

## 使用过的命令

```powershell
Get-Content src\pages\index.astro
Get-Content src\components\layout\Header.astro
Get-Content src\site.config.ts
Get-Content src\components\ThemeToggle.astro
```

用途：检查首页、顶栏、站点配置和暗色/亮色切换组件现状。

```powershell
npm run build
```

用途：验证 Astro 静态构建是否成功。

```powershell
npm run dev -- --host 127.0.0.1 --port 4321
```

用途：启动本地开发服务器，检查页面 HTTP 可访问性。

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321/ | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321/languages/zh/ | Select-Object -ExpandProperty StatusCode
```

用途：确认首页和语言筛选页本地返回 `200`。

```powershell
npx astro check
```

用途：单独验证 Astro/TypeScript 层。

```powershell
npm run check
```

用途：运行完整检查，即 `astro check && biome check`。

结果说明：

- `astro check` 已通过。
- `biome check` 仍失败，但主要来自既有文件：
  - `public/interactive/lecon-1.html` 中大量按钮缺少 `type="button"`。
  - 部分旧文件存在 Biome 格式化要求。
- 这些不是 Phase 4 首页布局新增问题。

```powershell
npx biome format --write ...
```

用途：格式化本次新增/修改的 Phase 3/Phase 4 相关 Astro/TS 文件。

## 验证结果

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 30 个页面。
- 新增语言页 `/languages/zh/` 已生成。
- 首页 `/index.html` 已生成。

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议以后换成正方形 icon。

这不影响首页布局功能。

### Astro 类型检查

执行：

```powershell
npx astro check
```

结果：

- 0 errors
- 0 warnings
- 0 hints

### 本地 HTTP 检查

本地 dev server：

```text
http://127.0.0.1:4321/
```

检查结果：

- `/` 返回 `200`
- `/languages/zh/` 返回 `200`

## Phase 4 清单状态

- [x] 顶栏：Logo、导航、语言切换、暗色/亮色切换。
- [x] 简介区：`Clifford Chen` + tagline。
- [x] Recent：显示最近 2-3 篇文章。
- [x] Explore：6 个分类方块 grid，并显示文章数量。
- [x] Series：横向系列卡片列表。

## 未完成或后续建议

- 当前语言切换是“按内容语言筛选”，不是完整 i18n UI 翻译。以后如果要整站中英法韩界面切换，需要新增 i18n 路由和翻译字典。
- 顶栏导航现在入口较多，如果后续移动端显得拥挤，可以把部分分类收进一个 Explore 菜单。
- `public/interactive/lecon-1.html` 可以另开一轮做可访问性清理，为所有按钮补 `type="button"`，这样 `npm run check` 才能全仓库通过。
