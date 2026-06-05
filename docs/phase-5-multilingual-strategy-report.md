# Phase 5 多语言策略检查与实现报告

日期：2026-06-06

## Phase 5 需求

- [x] 每篇文章支持 `lang: zh | en | fr | ko`。
- [x] UI 文案按浏览器语言切换。
- [x] 用户可手动选择 UI 语言，并保存到 `localStorage`。
- [x] 正文不翻译。
- [x] 文章页顶部显示语言标记。
- [x] 支持按语言筛选文章。
- [x] 避免实现全站 i18n。

## 检查结论

Phase 5 与当前博客方案不冲突。

原因：

- 当前内容系统已经要求文章 frontmatter 写 `lang`。
- 语言筛选页已经是独立入口，例如 `/languages/zh/`。
- 本轮新增的是轻量 UI 文案切换，不改变 URL 结构，不复制文章，不翻译正文。
- 这符合“避免实现全站 i18n”的要求。

## 已有能力

### 1. 每篇文章支持 lang

文件：

- `src/content/config.ts`

当前 schema 已支持：

```ts
lang: z.enum(["zh", "en", "fr", "ko"])
```

这意味着每篇文章必须明确写：

```yaml
lang: zh
```

或：

```yaml
lang: en
lang: fr
lang: ko
```

### 2. 支持按语言筛选文章

文件：

- `src/pages/languages/[lang]/index.astro`
- `src/components/LanguageSwitch.astro`
- `src/data/post.ts`

当前逻辑：

- `getLanguageCounts(posts)` 统计已有文章语言。
- 顶栏语言入口根据已有文章自动显示。
- `/languages/[lang]/` 根据文章的 `lang` 字段列出文章。

## 本轮新增能力

### 1. UI 文案按浏览器语言切换

新增文件：

- `src/components/UiLanguageProvider.astro`

接入位置：

- `src/layouts/Base.astro`

实现方式：

- 页面初始输出英文 UI。
- 浏览器加载后读取 `navigator.language`。
- 支持：
  - `zh`
  - `en`
  - `fr`
  - `ko`
- 只替换带有 `data-i18n` 或 `data-i18n-aria-label` 的 UI 元素。

这不是全站 i18n，因为：

- 没有新增 `/zh/`、`/fr/`、`/ko/` 这样的整站路由。
- 没有复制页面。
- 没有复制文章。
- 没有翻译正文。
- 只是浏览器端替换少量界面文字。
- 用户如果手动选择 UI 语言，会保存到 `localStorage`，优先级高于浏览器语言。

### 2. 首页 UI 文案加入切换标记

文件：

- `src/pages/index.astro`

加入切换的 UI 文案包括：

- `Recent`
- `All posts`
- `Explore`
- 6 个分类名称与说明
- `Series`
- `All series`
- `post/posts`

文章标题、文章摘要、文章正文不参与翻译。

### 2.1 主导航 UI 文案加入切换标记

文件：

- `src/site.config.ts`
- `src/components/layout/Header.astro`

新增内容：

- `menuLinks` 和 `exploreLinks` 增加 `i18nKey`。
- `Home / About / Posts / Series` 会随 UI 语言切换。
- `Math / Tech / Lang / Academia` 也会随 UI 语言切换。

示例：

- 中文 UI：`首页 / 关于 / 文章 / 系列`
- 法语 UI：`Accueil / À propos / Articles / Séries`
- 韩语 UI：`홈 / 소개 / 글 / 시리즈`

### 3. 顶栏 UI 文案加入切换标记

文件：

- `src/components/layout/Header.astro`
- `src/components/LanguageSwitch.astro`

加入切换的 UI 文案包括：

- `Explore`
- `Main menu` 的 aria-label
- `Open main menu`
- `Content language` 的 aria-label
- 语言入口的 aria-label

导航中的固定名称如 `Home`、`About`、`Posts`、`Series` 当前仍来自 `site.config.ts`。如果后续希望这些也按浏览器语言切换，可以继续加 `data-i18n` key。

### 4. 文章页顶部显示语言标记

文件：

- `src/components/blog/Masthead.astro`

新增显示：

```text
Language: 中文
Language: English
Language: Français
Language: 한국어
```

其中 `Language` 这个 UI 标签会按浏览器语言切换，后面的文章语言名称来自文章 metadata，不改变正文。

### 5. 手动选择 UI 语言

文件：

- `src/components/LanguageSwitch.astro`
- `src/components/UiLanguageProvider.astro`

新增行为：

- 顶栏显示 UI 语言按钮：
  - `EN`
  - `FR`
  - `KO`
  - `中文`
- 点击按钮后立即切换 UI 文案。
- 选择结果写入：

```text
localStorage["ui-language"]
```

优先级：

1. 用户手动选择的 `localStorage["ui-language"]`
2. 浏览器语言 `navigator.language`
3. 默认英文 `en`

说明：

- 手动选择只影响 UI 文案。
- 不影响文章正文。
- 不影响文章 URL。
- 不影响按语言筛选文章的 `/languages/[lang]/`。

## 正文不翻译的实现边界

本轮没有对文章正文做任何翻译处理。

具体边界：

- 不翻译 Markdown / MDX 正文。
- 不翻译 `public/interactive/lecon-1.html` 的课程正文。
- 不根据浏览器语言替换文章标题。
- 不自动生成多语言文章副本。
- 不新增全站 i18n 路由。

如果未来同一主题需要多语言版本，建议把它们作为不同文章管理，而不是自动翻译同一篇文章。

## 使用过的命令

```powershell
Get-Content src\components\blog\Masthead.astro
Get-Content src\components\LanguageSwitch.astro
Get-Content src\layouts\Base.astro
Get-Content src\pages\index.astro
```

用途：检查文章顶部、语言入口、基础布局和首页是否已经满足 Phase 5。

```powershell
npm run build
```

用途：确认 Astro 静态构建成功。

```powershell
npm run check
```

用途：确认 `astro check && biome check` 全仓库通过。

## 验证结果

### 构建

执行：

```powershell
npm run build
```

结果：

- 构建成功。
- 共生成 30 个页面。

仍有既有提示：

- `public/icon.svg` 不是正方形，webmanifest 插件建议未来换成正方形 icon。

这不影响 Phase 5。

### 完整检查

执行：

```powershell
npm run check
```

结果：

- `astro check`：0 errors / 0 warnings / 0 hints。
- `biome check`：通过。
- 共检查 60 个文件。

## Phase 5 状态

- [x] 每篇文章支持 `lang: zh | en | fr | ko`。
- [x] UI 文案按浏览器语言切换。
- [x] 用户可手动选择 UI 语言，并保存到 `localStorage`。
- [x] 正文不翻译。
- [x] 文章页顶部显示语言标记。
- [x] 支持按语言筛选文章。
- [x] 避免实现全站 i18n。

## 后续建议

- 如果以后希望导航 `Home / About / Posts / Series` 也随浏览器语言切换，可以继续给这些链接添加 `data-i18n`。
- 如果需要用户手动选择 UI 语言，可以在当前 `UiLanguageProvider` 基础上加 `localStorage` 偏好；现在默认只跟随浏览器语言。
